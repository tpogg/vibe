"""Discord bot — scrape, categorize, and upload server media via slash commands."""

import argparse
import logging
import sys
from datetime import datetime, timezone

import discord
from discord import app_commands

from .categorizer import categorize_download, get_summary
from .cloud_storage import GoogleDriveUploader
from .config import DISCORD_BOT_TOKEN, ORGANIZED_DIR, OWNER_ID
from .scraper import MediaScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def _is_owner(interaction: discord.Interaction) -> bool:
    return interaction.user.id == OWNER_ID


def _embed(title: str, desc: str, color: discord.Color) -> discord.Embed:
    e = discord.Embed(title=title, description=desc, color=color)
    e.timestamp = datetime.now(timezone.utc)
    return e


class VibeBot(discord.Client):
    def __init__(self, *, upload_to_drive: bool = True):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guilds = True
        super().__init__(intents=intents)

        self.tree = app_commands.CommandTree(self)
        self.upload_to_drive = upload_to_drive
        self._processing_guilds: set[int] = set()
        self._setup_commands()

    def _setup_commands(self):
        bot = self

        @self.tree.command(
            name="scrape",
            description="Download all media from this server, categorize, and upload to cloud",
        )
        @app_commands.describe(
            channel="Scrape only this channel (leave empty for entire server)",
            skip_upload="Keep files local only, don't upload to cloud",
            limit="Max messages to scan per channel (0 = all history)",
        )
        async def scrape(
            interaction: discord.Interaction,
            channel: discord.TextChannel | None = None,
            skip_upload: bool = False,
            limit: int = 0,
        ):
            if not _is_owner(interaction):
                await interaction.response.send_message(
                    "Only the bot owner can use this command.", ephemeral=True
                )
                return

            guild = interaction.guild
            if not guild:
                await interaction.response.send_message(
                    "This command can only be used in a server.", ephemeral=True
                )
                return

            if guild.id in bot._processing_guilds:
                await interaction.response.send_message(
                    "This server is already being scraped.", ephemeral=True
                )
                return

            target = channel.mention if channel else "entire server"
            await interaction.response.send_message(
                embed=_embed("Scrape Started", f"Target: **{target}**\nThis may take a while...", discord.Color.blue())
            )

            bot._processing_guilds.add(guild.id)
            try:
                await bot._run_pipeline(interaction, guild, channel, skip_upload, limit)
            finally:
                bot._processing_guilds.discard(guild.id)

        @self.tree.command(name="scrape-status", description="Show accessible channels in this server")
        async def scrape_status(interaction: discord.Interaction):
            if not _is_owner(interaction):
                await interaction.response.send_message("Owner only.", ephemeral=True)
                return

            guild = interaction.guild
            if not guild:
                return

            accessible, blocked = [], []
            for ch in guild.text_channels:
                perms = ch.permissions_for(guild.me)
                if perms.read_messages and perms.read_message_history:
                    accessible.append(ch.mention)
                else:
                    blocked.append(ch.mention)

            desc = f"**Accessible ({len(accessible)}):** {', '.join(accessible[:50]) or 'None'}"
            if blocked:
                desc += f"\n**No access ({len(blocked)}):** {', '.join(blocked[:20])}"

            await interaction.response.send_message(
                embed=_embed("Server Access", desc, discord.Color.green())
            )

        @self.tree.command(name="scrape-cancel", description="Cancel an in-progress scrape")
        async def scrape_cancel(interaction: discord.Interaction):
            if not _is_owner(interaction):
                await interaction.response.send_message("Owner only.", ephemeral=True)
                return

            guild = interaction.guild
            if not guild or guild.id not in bot._processing_guilds:
                await interaction.response.send_message("No scrape running.", ephemeral=True)
                return

            bot._processing_guilds.discard(guild.id)
            await interaction.response.send_message(
                embed=_embed("Cancelled", "Scrape has been stopped.", discord.Color.orange())
            )

    async def _run_pipeline(
        self,
        interaction: discord.Interaction,
        guild: discord.Guild,
        channel: discord.TextChannel | None,
        skip_upload: bool,
        limit: int,
    ):
        scraper = MediaScraper()

        try:
            # --- Step 1: Download ---
            target_name = f"#{channel.name}" if channel else "all channels"
            await interaction.edit_original_response(
                embed=_embed("Step 1/3 — Downloading", f"Scraping media from {target_name}...", discord.Color.blue())
            )

            if channel:
                download_dir = await scraper.scrape_channel(guild, channel, limit=limit)
            else:
                download_dir = await scraper.scrape_guild(guild, limit=limit)

            stats = scraper.stats
            await interaction.edit_original_response(
                embed=_embed(
                    "Step 1/3 — Download Complete",
                    f"**{stats['downloaded']}** downloaded, **{stats['skipped']}** skipped, **{stats['failed']}** failed",
                    discord.Color.green(),
                )
            )

            if stats["downloaded"] == 0:
                await interaction.edit_original_response(
                    embed=_embed("Done", "No new files found.", discord.Color.greyple())
                )
                return

            # --- Step 2: Categorize ---
            await interaction.edit_original_response(
                embed=_embed("Step 2/3 — Categorizing", "Organizing files by type...", discord.Color.blue())
            )

            output_dir = ORGANIZED_DIR / download_dir.name
            categorize_download(download_dir, output_dir)
            summary = get_summary(output_dir)

            summary_text = "\n".join(f"**{cat}:** {count}" for cat, count in summary.items())
            await interaction.edit_original_response(
                embed=_embed("Step 2/3 — Categorized", summary_text or "No files.", discord.Color.green())
            )

            # --- Step 3: Upload ---
            should_upload = self.upload_to_drive and not skip_upload
            if should_upload:
                await interaction.edit_original_response(
                    embed=_embed("Step 3/3 — Uploading", "Uploading to Google Drive...", discord.Color.blue())
                )
                try:
                    uploader = GoogleDriveUploader()
                    uploader.upload_directory(output_dir)
                    u = uploader.stats

                    await interaction.edit_original_response(
                        embed=_embed(
                            "Done!",
                            f"**Downloaded:** {stats['downloaded']}\n"
                            f"**Uploaded:** {u['uploaded']} ({u['failed']} failed)\n"
                            f"**Categories:**\n{summary_text}",
                            discord.Color.gold(),
                        )
                    )
                except Exception as exc:
                    logger.exception("Upload failed")
                    await interaction.edit_original_response(
                        embed=_embed(
                            "Upload Failed",
                            f"Scrape succeeded but upload failed: `{exc}`\nFiles at `{output_dir}`",
                            discord.Color.red(),
                        )
                    )
            else:
                await interaction.edit_original_response(
                    embed=_embed(
                        "Done! (Local Only)",
                        f"**Downloaded:** {stats['downloaded']}\n**Categories:**\n{summary_text}\n\nFiles at `{output_dir}`",
                        discord.Color.gold(),
                    )
                )
        finally:
            await scraper.close()

    async def on_ready(self):
        logger.info("Bot ready — %s (ID: %s)", self.user, self.user.id)
        logger.info("In %d guild(s)", len(self.guilds))
        await self.tree.sync()
        logger.info("Slash commands synced")


def main():
    parser = argparse.ArgumentParser(description="Vibe Discord bot — scrape, categorize, upload")
    parser.add_argument("--no-upload", action="store_true", help="Disable Google Drive upload")
    parser.add_argument("-v", "--verbose", action="store_true", help="Debug logging")
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if not DISCORD_BOT_TOKEN:
        logger.error("DISCORD_BOT_TOKEN not set. Add it to .env.")
        sys.exit(1)

    if OWNER_ID == 0:
        logger.warning("OWNER_ID not set — nobody can use scrape commands.")

    bot = VibeBot(upload_to_drive=not args.no_upload)
    bot.run(DISCORD_BOT_TOKEN)


if __name__ == "__main__":
    main()
