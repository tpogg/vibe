"""Scrapes media and file attachments directly from Discord channels via bot API."""

import asyncio
import logging
from pathlib import Path
from urllib.parse import urlparse

import aiohttp
import discord

from .config import DOWNLOAD_DIR, MAX_CONCURRENT_DOWNLOADS, MAX_FILE_SIZE_MB
from .progress import EventType, progress

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

    async def scrape_guild(self, guild: discord.Guild, *, limit: int = 0) -> Path:
        """Scrape all accessible text channels in a guild."""
        guild_dir = DOWNLOAD_DIR / _sanitize(guild.name)
        guild_dir.mkdir(parents=True, exist_ok=True)

        self.stats = {"downloaded": 0, "skipped": 0, "failed": 0}
        msg_limit = limit if limit > 0 else None

        channels = []
        for channel in guild.text_channels:
            perms = channel.permissions_for(guild.me)
            if not perms.read_messages or not perms.read_message_history:
                progress.emit(EventType.LOG, f"Skipping #{channel.name} — missing permissions")
                continue
            channels.append(channel)

        progress.emit(
            EventType.SCRAPE_START,
            f"Scraping {len(channels)} channels from {guild.name}",
            guild=guild.name, channel_count=len(channels),
        )

        tasks = [self._scrape_channel(ch, guild_dir, msg_limit) for ch in channels]
        await asyncio.gather(*tasks)

        progress.emit(
            EventType.SCRAPE_DONE,
            f"Scrape complete: {self.stats['downloaded']} downloaded, "
            f"{self.stats['skipped']} skipped, {self.stats['failed']} failed",
            **self.stats,
        )
        return guild_dir

    async def scrape_channel(
        self, guild: discord.Guild, channel: discord.TextChannel, *, limit: int = 0
    ) -> Path:
        """Scrape a single channel."""
        guild_dir = DOWNLOAD_DIR / _sanitize(guild.name)
        guild_dir.mkdir(parents=True, exist_ok=True)

        self.stats = {"downloaded": 0, "skipped": 0, "failed": 0}
        msg_limit = limit if limit > 0 else None

        progress.emit(
            EventType.SCRAPE_START,
            f"Scraping #{channel.name}",
            guild=guild.name, channel_count=1,
        )

        await self._scrape_channel(channel, guild_dir, msg_limit)

        progress.emit(
            EventType.SCRAPE_DONE,
            f"Scrape complete: {self.stats['downloaded']} downloaded, "
            f"{self.stats['skipped']} skipped, {self.stats['failed']} failed",
            **self.stats,
        )
        return guild_dir

    async def _scrape_channel(
        self, channel: discord.TextChannel, guild_dir: Path, msg_limit: int | None
    ):
        channel_dir = guild_dir / _sanitize(channel.name)
        channel_dir.mkdir(parents=True, exist_ok=True)

        count = 0
        progress.emit(
            EventType.SCRAPE_CHANNEL_START,
            f"Scanning #{channel.name}...",
            channel=channel.name,
        )

        try:
            async for message in channel.history(limit=msg_limit, oldest_first=True):
                for attachment in message.attachments:
                    await self._download_file(
                        url=attachment.url,
                        dest_dir=channel_dir,
                        filename=attachment.filename,
                        file_size=attachment.size,
                        channel_name=channel.name,
                    )
                    count += 1

                for embed in message.embeds:
                    for media in _extract_embed_urls(embed):
                        await self._download_file(
                            url=media["url"],
                            dest_dir=channel_dir,
                            filename=media["filename"],
                            channel_name=channel.name,
                        )
                        count += 1
        except discord.Forbidden:
            progress.emit(EventType.LOG, f"Lost access to #{channel.name}")
        except discord.HTTPException as exc:
            progress.emit(EventType.LOG, f"HTTP error in #{channel.name}: {exc}")

        progress.emit(
            EventType.SCRAPE_CHANNEL_DONE,
            f"#{channel.name} — {count} items processed",
            channel=channel.name, items=count,
        )

    async def _download_file(
        self, url: str, dest_dir: Path, filename: str,
        file_size: int | None = None, channel_name: str = "",
    ):
        size_limit = MAX_FILE_SIZE_MB * 1024 * 1024 if MAX_FILE_SIZE_MB > 0 else 0

        if size_limit > 0 and file_size and file_size > size_limit:
            self.stats["skipped"] += 1
            return

        dest_path = dest_dir / _safe_filename(filename)
        if dest_path.exists():
            self.stats["skipped"] += 1
            return

        async with self._semaphore:
            try:
                session = await self._get_session()
                async with session.get(url) as resp:
                    if resp.status != 200:
                        self.stats["failed"] += 1
                        return

                    if size_limit > 0 and file_size is None:
                        cl = resp.headers.get("Content-Length")
                        if cl and int(cl) > size_limit:
                            self.stats["skipped"] += 1
                            return

                    dest_path = _deduplicate(dest_path)
                    with open(dest_path, "wb") as f:
                        async for chunk in resp.content.iter_chunked(8192):
                            f.write(chunk)

                self.stats["downloaded"] += 1
                progress.emit(
                    EventType.SCRAPE_FILE,
                    f"Downloaded: {filename}",
                    filename=filename, channel=channel_name,
                    **self.stats,
                )

            except Exception:
                logger.exception("Error downloading %s", url)
                self.stats["failed"] += 1


def _extract_embed_urls(embed: discord.Embed) -> list[dict]:
    results = []
    if embed.image and embed.image.url:
        results.append({"url": embed.image.url, "filename": _filename_from_url(embed.image.url)})
    if embed.thumbnail and embed.thumbnail.url:
        results.append({"url": embed.thumbnail.url, "filename": _filename_from_url(embed.thumbnail.url)})
    if embed.video and embed.video.url:
        results.append({"url": embed.video.url, "filename": _filename_from_url(embed.video.url)})
    return results


def _filename_from_url(url: str) -> str:
    name = Path(urlparse(url).path).name
    return name if name else "unknown_file"


def _sanitize(name: str) -> str:
    return "".join(c if c.isalnum() or c in ("-", "_", " ") else "_" for c in name).strip()


def _safe_filename(name: str) -> str:
    return "".join(c if c.isalnum() or c in ("-", "_", ".", " ") else "_" for c in name).strip()


def _deduplicate(path: Path) -> Path:
    if not path.exists():
        return path
    stem, suffix, counter = path.stem, path.suffix, 1
    while True:
        new_path = path.parent / f"{stem}_{counter}{suffix}"
        if not new_path.exists():
            return new_path
        counter += 1
