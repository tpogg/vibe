"""Discord bot that scrapes server media on demand via slash commands."""

import argparse
import logging
import sys
from datetime import datetime, timezone

import discord
from discord import app_commands

from .categorizer import categorize_guild_files, get_category_summary
from .cloud_storage import GoogleDriveUploader
from .config import DISCORD_BOT_TOKEN, OWNER_ID
from .scraper import MediaScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def _is_owner(interaction: discord.Interaction) -> bool:
    return interaction.user.id == OWNER_ID


def _progress_embed(title: str, description: str, color: discord.Color) -> discord.Embed:
    embed = discord.Embed(title=title, description=description, color=color)
    embed.timestamp = datetime.now(timezone.utc)
    return embed


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

        @self.tree.command(name="scrape", description="Scrape all media from this server and upload to Google Drive")
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
                await interaction.response.send_message("Only the bot owner can use this command.", ephemeral=True)
                return

            guild = interaction.guild
            if not guild:
                await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
                return

            if guild.id in bot._processing_guilds:
                await interaction.response.send_message("This server is already being scraped.", ephemeral=True)
                return

            await interaction.response.send_message(
                embed=_progress_embed(
                    "Scrape Started",
                    f"Targeting: **{channel.mention if channel else 'entire server'}**\nThis may take a while...",
                    discord.Color.blue(),
                )
            )

            bot._processing_guilds.add(guild.id)
            try:
                await bot._run_pipeline(interaction, guild, channel, skip_upload, limit)
            finally:
                bot._processing_guilds.discard(guild.id)

        @self.tree.command(name="scrape-status", description="Show what the bot can access in this server")
        async def scrape_status(interaction: discord.Interaction):
            if not _is_owner(interaction):
                await interaction.response.send_message("Only the bot owner can use this command.", ephemeral=True)
                return

            guild = interaction.guild
            if not guild:
                await interaction.response.send_message("Use in a server.", ephemeral=True)
                return

            accessible = []
            blocked = []
            for ch in guild.text_channels:
                perms = ch.permissions_for(guild.me)
                if perms.read_messages and perms.read_message_history:
                    accessible.append(ch.mention)
                else:
                    blocked.append(ch.mention)

            desc = f"**Accessible channels ({len(accessible)}):**\n"
            desc += ", ".join(accessible[:50]) if accessible else "None"
            if len(accessible) > 50:
                desc += f"\n...and {len(accessible) - 50} more"
            if blocked:
                desc += f"\n\n**No access ({len(blocked)}):**\n"
                desc += ", ".join(blocked[:20])
                if len(blocked) > 20:
                    desc += f"\n...and {len(blocked) - 20} more"

            in_progress = guild.id in bot._processing_guilds
            if in_progress:
                desc += "\n\n**Status:** Scrape in progress..."

            await interaction.response.send_message(
                embed=_progress_embed("Server Access Report", desc, discord.Color.green())
            )

        @self.tree.command(name="scrape-cancel", description="Cancel an in-progress scrape for this server")
        async def scrape_cancel(interaction: discord.Interaction):
            if not _is_owner(interaction):
                await interaction.response.send_message("Only the bot owner can use this command.", ephemeral=True)
                return

            guild = interaction.guild
            if not guild or guild.id not in bot._processing_guilds:
                await interaction.response.send_message("No scrape is running for this server.", ephemeral=True)
                return

            bot._processing_guilds.discard(guild.id)
            await interaction.response.send_message(
                embed=_progress_embed("Scrape Cancelled", "The current scrape has been stopped.", discord.Color.orange())
            )

    async def _run_pipeline(
        self,
        interaction: discord.Interaction,
        guild: discord.Guild,
        channel: discord.TextChannel | None,
        skip_upload: bool,
        limit: int,
    ):
        """Full pipeline: scrape -> categorize -> upload, with progress updates."""
        scraper = MediaScraper()

        try:
            # --- Step 1: Scrape ---
            await interaction.edit_original_response(
                embed=_progress_embed(
                    "Step 1/3 — Scraping",
                    f"Downloading media from {'#' + channel.name if channel else 'all channels'}...",
                    discord.Color.blue(),
                )
            )

            if channel:
                guild_dir = await scraper.scrape_channel(guild, channel, limit=limit)
            else:
                guild_dir = await scraper.scrape_guild(guild, limit=limit)

            stats = scraper.stats
            await interaction.edit_original_response(
                embed=_progress_embed(
                    "Step 1/3 — Scrape Complete",
                    f"Downloaded **{stats['downloaded']}** files\n"
                    f"Skipped **{stats['skipped']}** (duplicates/too large)\n"
                    f"Failed **{stats['failed']}**",
                    discord.Color.green(),
                )
            )

            if stats["downloaded"] == 0:
                await interaction.edit_original_response(
                    embed=_progress_embed(
                        "Scrape Complete",
                        "No new files found to download.",
                        discord.Color.greyple(),
                    )
                )
                return

            # --- Step 2: Categorize ---
            await interaction.edit_original_response(
                embed=_progress_embed(
                    "Step 2/3 — Categorizing",
                    "Organizing files by type...",
                    discord.Color.blue(),
                )
            )

            organized_dir = categorize_guild_files(guild_dir)
            summary = get_category_summary(organized_dir)

            summary_text = "\n".join(
                f"**{cat}:** {len(files)} files" for cat, files in summary.items()
            )

            await interaction.edit_original_response(
                embed=_progress_embed(
                    "Step 2/3 — Categorization Complete",
                    summary_text or "No files categorized.",
                    discord.Color.green(),
                )
            )

            # --- Step 3: Upload ---
            should_upload = self.upload_to_drive and not skip_upload

            if should_upload:
                await interaction.edit_original_response(
                    embed=_progress_embed(
                        "Step 3/3 — Uploading to Google Drive",
                        "Uploading organized files to cloud...",
                        discord.Color.blue(),
                    )
                )
                try:
                    uploader = GoogleDriveUploader()
                    uploader.upload_directory(organized_dir)
                    upload_stats = uploader.stats

                    await interaction.edit_original_response(
                        embed=_progress_embed(
                            "Done!",
                            f"**Scrape:** {stats['downloaded']} downloaded, "
                            f"{stats['skipped']} skipped, {stats['failed']} failed\n"
                            f"**Upload:** {upload_stats['uploaded']} uploaded, "
                            f"{upload_stats['failed']} failed\n"
                            f"**Categories:**\n{summary_text}",
                            discord.Color.gold(),
                        )
                    )
                except Exception as exc:
                    logger.exception("Google Drive upload failed")
                    await interaction.edit_original_response(
                        embed=_progress_embed(
                            "Upload Failed",
                            f"Scrape succeeded but cloud upload failed:\n`{exc}`\n\n"
                            f"Files saved locally at `{organized_dir}`",
                            discord.Color.red(),
                        )
                    )
            else:
                await interaction.edit_original_response(
                    embed=_progress_embed(
                        "Done! (Local Only)",
                        f"**Downloaded:** {stats['downloaded']} files\n"
                        f"**Categories:**\n{summary_text}\n\n"
                        f"Files saved to `{organized_dir}`",
                        discord.Color.gold(),
                    )
                )

        finally:
            await scraper.close()

    async def on_ready(self):
        logger.info("Bot is ready — logged in as %s (ID: %s)", self.user, self.user.id)
        logger.info("Connected to %d guild(s)", len(self.guilds))
        await self.tree.sync()
        logger.info("Slash commands synced")

    async def setup_hook(self):
        logger.info("Setting up bot...")


def main():
    parser = argparse.ArgumentParser(
        description="Discord Media Scraper — archive server media to Google Drive"
    )
    parser.add_argument(
        "--no-upload",
        action="store_true",
        help="Disable Google Drive upload globally (can still be overridden per-command)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable debug logging",
    )
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if not DISCORD_BOT_TOKEN:
        logger.error(
            "DISCORD_BOT_TOKEN is not set. "
            "Add it to your .env file or set the environment variable."
        )
        sys.exit(1)

    if OWNER_ID == 0:
        logger.warning(
            "OWNER_ID is not set — nobody will be able to use scrape commands. "
            "Set it in your .env file."
        )

    bot = VibeBot(upload_to_drive=not args.no_upload)
    bot.run(DISCORD_BOT_TOKEN)


if __name__ == "__main__":
    main()
