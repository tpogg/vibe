"""Discord bot that scrapes and archives server media to Google Drive."""

import argparse
import asyncio
import logging
import sys

import discord

from .categorizer import categorize_guild_files, get_category_summary
from .cloud_storage import GoogleDriveUploader
from .config import DISCORD_BOT_TOKEN, SCRAPE_ON_JOIN
from .scraper import MediaScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


class VibeBot(discord.Client):
    def __init__(self, *, upload_to_drive: bool = True):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guilds = True
        super().__init__(intents=intents)

        self.scraper = MediaScraper()
        self.upload_to_drive = upload_to_drive
        self._processing_guilds: set[int] = set()

    async def on_ready(self):
        logger.info("Bot is ready — logged in as %s (ID: %s)", self.user, self.user.id)
        logger.info("Connected to %d guild(s)", len(self.guilds))

    async def on_guild_join(self, guild: discord.Guild):
        """Triggered when the bot joins a new server."""
        logger.info("Joined guild: %s (ID: %s)", guild.name, guild.id)

        if SCRAPE_ON_JOIN:
            await self.process_guild(guild)

    async def process_guild(self, guild: discord.Guild):
        """Full pipeline: scrape -> categorize -> upload."""
        if guild.id in self._processing_guilds:
            logger.info("Guild %s is already being processed, skipping", guild.name)
            return

        self._processing_guilds.add(guild.id)
        try:
            # Step 1: Scrape all media
            logger.info("=== Step 1/3: Scraping media from '%s' ===", guild.name)
            guild_dir = await self.scraper.scrape_guild(guild)

            # Step 2: Categorize files
            logger.info("=== Step 2/3: Categorizing files ===")
            organized_dir = categorize_guild_files(guild_dir)

            summary = get_category_summary(organized_dir)
            for category, files in summary.items():
                logger.info("  %s: %d files", category, len(files))

            # Step 3: Upload to Google Drive
            if self.upload_to_drive:
                logger.info("=== Step 3/3: Uploading to Google Drive ===")
                try:
                    uploader = GoogleDriveUploader()
                    uploader.upload_directory(organized_dir)
                    logger.info("Upload to Google Drive complete!")
                except Exception:
                    logger.exception(
                        "Google Drive upload failed. Files are still available "
                        "locally at: %s",
                        organized_dir,
                    )
            else:
                logger.info(
                    "=== Step 3/3: Skipping cloud upload (--no-upload) ==="
                )
                logger.info("Organized files are at: %s", organized_dir)

            logger.info("=== Done processing '%s' ===", guild.name)

        finally:
            self._processing_guilds.discard(guild.id)
            await self.scraper.close()

    async def scrape_all_guilds(self):
        """Scrape all guilds the bot is currently in (for manual/CLI use)."""
        await self.wait_until_ready()
        for guild in self.guilds:
            await self.process_guild(guild)


def main():
    parser = argparse.ArgumentParser(
        description="Discord Media Scraper — archive server media to Google Drive"
    )
    parser.add_argument(
        "--no-upload",
        action="store_true",
        help="Skip Google Drive upload; keep files locally only",
    )
    parser.add_argument(
        "--scrape-existing",
        action="store_true",
        help="Scrape all servers the bot is already in on startup",
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

    bot = VibeBot(upload_to_drive=not args.no_upload)

    if args.scrape_existing:
        async def run():
            async with bot:
                task = asyncio.create_task(bot.scrape_all_guilds())
                await bot.start(DISCORD_BOT_TOKEN)
                await task
        asyncio.run(run())
    else:
        bot.run(DISCORD_BOT_TOKEN)


if __name__ == "__main__":
    main()
