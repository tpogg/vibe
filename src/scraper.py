"""Scrapes media and file attachments from Discord server channels."""

import asyncio
import logging
from pathlib import Path
from urllib.parse import urlparse

import aiohttp
import discord

from .config import (
    DOWNLOAD_DIR,
    MAX_CONCURRENT_DOWNLOADS,
    MAX_FILE_SIZE_MB,
    SCRAPE_HISTORY_LIMIT,
)

logger = logging.getLogger(__name__)


class MediaScraper:
    """Downloads all media and file attachments from a Discord guild."""

    def __init__(self):
        self._semaphore = asyncio.Semaphore(MAX_CONCURRENT_DOWNLOADS)
        self._session: aiohttp.ClientSession | None = None
        self.stats = {"downloaded": 0, "skipped": 0, "failed": 0}

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()

    async def scrape_guild(self, guild: discord.Guild) -> Path:
        """Scrape all accessible text channels in a guild.

        Returns the path to the guild's download directory.
        """
        guild_dir = DOWNLOAD_DIR / _sanitize(guild.name)
        guild_dir.mkdir(parents=True, exist_ok=True)

        self.stats = {"downloaded": 0, "skipped": 0, "failed": 0}

        tasks = []
        for channel in guild.text_channels:
            perms = channel.permissions_for(guild.me)
            if not perms.read_messages or not perms.read_message_history:
                logger.info("Skipping #%s — missing permissions", channel.name)
                continue
            tasks.append(self._scrape_channel(channel, guild_dir))

        await asyncio.gather(*tasks)

        logger.info(
            "Guild '%s' scrape complete — downloaded: %d, skipped: %d, failed: %d",
            guild.name,
            self.stats["downloaded"],
            self.stats["skipped"],
            self.stats["failed"],
        )
        return guild_dir

    async def _scrape_channel(
        self, channel: discord.TextChannel, guild_dir: Path
    ):
        """Iterate through a channel's history and download attachments + embeds."""
        channel_dir = guild_dir / _sanitize(channel.name)
        channel_dir.mkdir(parents=True, exist_ok=True)

        limit = SCRAPE_HISTORY_LIMIT if SCRAPE_HISTORY_LIMIT > 0 else None
        count = 0

        logger.info("Scraping #%s ...", channel.name)

        try:
            async for message in channel.history(limit=limit, oldest_first=True):
                # Download file attachments
                for attachment in message.attachments:
                    await self._download_file(
                        url=attachment.url,
                        dest_dir=channel_dir,
                        filename=attachment.filename,
                        file_size=attachment.size,
                    )
                    count += 1

                # Download embedded media (images/videos/thumbnails)
                for embed in message.embeds:
                    for media in _extract_embed_urls(embed):
                        await self._download_file(
                            url=media["url"],
                            dest_dir=channel_dir,
                            filename=media["filename"],
                        )
                        count += 1
        except discord.Forbidden:
            logger.warning("Lost access to #%s during scrape", channel.name)
        except discord.HTTPException as exc:
            logger.error("HTTP error scraping #%s: %s", channel.name, exc)

        logger.info("  #%s — processed %d items", channel.name, count)

    async def _download_file(
        self,
        url: str,
        dest_dir: Path,
        filename: str,
        file_size: int | None = None,
    ):
        """Download a single file, respecting concurrency and size limits."""
        if MAX_FILE_SIZE_MB > 0 and file_size and file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
            logger.debug("Skipping %s — exceeds size limit", filename)
            self.stats["skipped"] += 1
            return

        dest_path = dest_dir / _safe_filename(filename)

        # Skip if already downloaded
        if dest_path.exists():
            self.stats["skipped"] += 1
            return

        async with self._semaphore:
            try:
                session = await self._get_session()
                async with session.get(url) as resp:
                    if resp.status != 200:
                        logger.warning("Failed to download %s (HTTP %d)", url, resp.status)
                        self.stats["failed"] += 1
                        return

                    # Check content-length if we didn't already know size
                    if MAX_FILE_SIZE_MB > 0 and file_size is None:
                        cl = resp.headers.get("Content-Length")
                        if cl and int(cl) > MAX_FILE_SIZE_MB * 1024 * 1024:
                            logger.debug("Skipping %s — exceeds size limit", filename)
                            self.stats["skipped"] += 1
                            return

                    # Handle duplicate filenames by appending a counter
                    dest_path = _deduplicate(dest_path)

                    with open(dest_path, "wb") as f:
                        async for chunk in resp.content.iter_chunked(8192):
                            f.write(chunk)

                self.stats["downloaded"] += 1
                logger.debug("Downloaded: %s", dest_path.name)

            except Exception:
                logger.exception("Error downloading %s", url)
                self.stats["failed"] += 1


def _extract_embed_urls(embed: discord.Embed) -> list[dict]:
    """Pull downloadable URLs from an embed."""
    results = []
    if embed.image and embed.image.url:
        results.append({
            "url": embed.image.url,
            "filename": _filename_from_url(embed.image.url),
        })
    if embed.thumbnail and embed.thumbnail.url:
        results.append({
            "url": embed.thumbnail.url,
            "filename": _filename_from_url(embed.thumbnail.url),
        })
    if embed.video and embed.video.url:
        results.append({
            "url": embed.video.url,
            "filename": _filename_from_url(embed.video.url),
        })
    return results


def _filename_from_url(url: str) -> str:
    parsed = urlparse(url)
    name = Path(parsed.path).name
    return name if name else "unknown_file"


def _sanitize(name: str) -> str:
    """Sanitize a name for use as a directory/file name."""
    return "".join(c if c.isalnum() or c in ("-", "_", " ") else "_" for c in name).strip()


def _safe_filename(name: str) -> str:
    return "".join(c if c.isalnum() or c in ("-", "_", ".", " ") else "_" for c in name).strip()


def _deduplicate(path: Path) -> Path:
    """If path exists, append a counter to avoid overwriting."""
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    counter = 1
    while True:
        new_path = path.parent / f"{stem}_{counter}{suffix}"
        if not new_path.exists():
            return new_path
        counter += 1
