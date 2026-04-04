"""FastAPI web app — UI for configuring and running the scraper pipeline."""

import asyncio
import json
import logging
import os
from pathlib import Path

import discord
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel

from .categorizer import categorize_download, get_summary
from .cloud_storage import GoogleDriveUploader
from .config import ORGANIZED_DIR
from .progress import EventType, progress
from .scraper import MediaScraper

logger = logging.getLogger(__name__)

app = FastAPI(title="Vibe — Discord Media Scraper")

# ── In-memory state ──────────────────────────────────────────────────────────

_bot: discord.Client | None = None
_bot_task: asyncio.Task | None = None
_scrape_task: asyncio.Task | None = None


# ── Models ───────────────────────────────────────────────────────────────────

class ConnectRequest(BaseModel):
    bot_token: str
    owner_id: int


class ScrapeRequest(BaseModel):
    guild_id: str
    channel_id: str | None = None
    limit: int = 0
    skip_upload: bool = False
    google_credentials_path: str = ""
    google_drive_folder_id: str = ""


class DriveConfig(BaseModel):
    credentials_path: str
    folder_id: str


# ── API Routes ───────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def index():
    html_path = Path(__file__).parent / "templates" / "index.html"
    return HTMLResponse(html_path.read_text())


@app.post("/api/connect")
async def connect_bot(req: ConnectRequest):
    """Start the Discord bot with provided credentials."""
    global _bot, _bot_task

    if _bot and not _bot.is_closed():
        await _bot.close()
        if _bot_task:
            _bot_task.cancel()

    intents = discord.Intents.default()
    intents.message_content = True
    intents.guilds = True
    _bot = discord.Client(intents=intents)

    os.environ["OWNER_ID"] = str(req.owner_id)

    ready_event = asyncio.Event()

    @_bot.event
    async def on_ready():
        ready_event.set()

    async def run_bot():
        try:
            await _bot.start(req.bot_token)
        except discord.LoginFailure:
            progress.emit(EventType.PIPELINE_ERROR, "Invalid bot token")
        except Exception as exc:
            progress.emit(EventType.PIPELINE_ERROR, f"Bot error: {exc}")

    _bot_task = asyncio.create_task(run_bot())

    # Wait for bot to be ready (timeout 15s)
    try:
        await asyncio.wait_for(ready_event.wait(), timeout=15)
    except asyncio.TimeoutError:
        return {"ok": False, "error": "Bot took too long to connect. Check your token."}

    return {
        "ok": True,
        "bot_name": str(_bot.user),
        "guilds": [
            {"id": str(g.id), "name": g.name, "icon": str(g.icon.url) if g.icon else None}
            for g in _bot.guilds
        ],
    }


@app.post("/api/disconnect")
async def disconnect_bot():
    """Stop the Discord bot."""
    global _bot, _bot_task
    if _bot and not _bot.is_closed():
        await _bot.close()
    if _bot_task:
        _bot_task.cancel()
    _bot = None
    _bot_task = None
    return {"ok": True}


@app.get("/api/guilds")
async def list_guilds():
    """List servers the bot is in."""
    if not _bot or _bot.is_closed():
        return {"ok": False, "error": "Bot not connected"}

    return {
        "ok": True,
        "guilds": [
            {"id": str(g.id), "name": g.name, "icon": str(g.icon.url) if g.icon else None}
            for g in _bot.guilds
        ],
    }


@app.get("/api/guilds/{guild_id}/channels")
async def list_channels(guild_id: int):
    """List text channels in a guild."""
    if not _bot or _bot.is_closed():
        return {"ok": False, "error": "Bot not connected"}

    guild = _bot.get_guild(guild_id)
    if not guild:
        return {"ok": False, "error": "Guild not found"}

    channels = []
    for ch in guild.text_channels:
        perms = ch.permissions_for(guild.me)
        channels.append({
            "id": str(ch.id),
            "name": ch.name,
            "category": ch.category.name if ch.category else None,
            "accessible": perms.read_messages and perms.read_message_history,
        })

    return {"ok": True, "channels": channels}


@app.post("/api/scrape")
async def start_scrape(req: ScrapeRequest):
    """Kick off the full pipeline: scrape -> categorize -> upload."""
    global _scrape_task

    if not _bot or _bot.is_closed():
        return {"ok": False, "error": "Bot not connected"}

    if _scrape_task and not _scrape_task.done():
        return {"ok": False, "error": "A scrape is already running"}

    guild = _bot.get_guild(int(req.guild_id))
    if not guild:
        return {"ok": False, "error": "Guild not found"}

    channel = None
    if req.channel_id:
        channel = guild.get_channel(int(req.channel_id))

    # Override google drive config if provided
    if req.google_credentials_path:
        os.environ["GOOGLE_CREDENTIALS_FILE"] = req.google_credentials_path
    if req.google_drive_folder_id:
        os.environ["GOOGLE_DRIVE_ROOT_FOLDER_ID"] = req.google_drive_folder_id

    _scrape_task = asyncio.create_task(
        _run_pipeline(guild, channel, req.limit, req.skip_upload)
    )

    return {"ok": True}


@app.post("/api/scrape/cancel")
async def cancel_scrape():
    """Cancel the running scrape."""
    global _scrape_task
    if _scrape_task and not _scrape_task.done():
        _scrape_task.cancel()
        progress.emit(EventType.PIPELINE_ERROR, "Scrape cancelled by user")
        return {"ok": True}
    return {"ok": False, "error": "No scrape running"}


@app.get("/api/scrape/status")
async def scrape_status():
    """Check if a scrape is running."""
    running = _scrape_task is not None and not _scrape_task.done()
    return {"ok": True, "running": running}


@app.get("/api/progress")
async def progress_stream(request: Request):
    """SSE endpoint — streams live progress events."""
    queue = progress.subscribe()

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    yield event.to_sse()
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            progress.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Pipeline ─────────────────────────────────────────────────────────────────

async def _run_pipeline(
    guild: discord.Guild,
    channel: discord.TextChannel | None,
    limit: int,
    skip_upload: bool,
):
    """Execute the full scrape -> categorize -> upload pipeline."""
    progress.clear()
    scraper = MediaScraper()

    target = f"#{channel.name}" if channel else guild.name
    progress.emit(EventType.PIPELINE_START, f"Starting pipeline for {target}")

    try:
        # Step 1: Scrape
        if channel:
            download_dir = await scraper.scrape_channel(guild, channel, limit=limit)
        else:
            download_dir = await scraper.scrape_guild(guild, limit=limit)

        if scraper.stats["downloaded"] == 0:
            progress.emit(EventType.PIPELINE_DONE, "No new files found")
            return

        # Step 2: Categorize
        output_dir = ORGANIZED_DIR / download_dir.name
        categorize_download(download_dir, output_dir)
        summary = get_summary(output_dir)

        # Step 3: Upload
        if not skip_upload:
            try:
                uploader = GoogleDriveUploader()
                uploader.upload_directory(output_dir)
            except Exception as exc:
                progress.emit(
                    EventType.PIPELINE_ERROR,
                    f"Upload failed: {exc}. Files saved locally at {output_dir}",
                )
                return

        progress.emit(
            EventType.PIPELINE_DONE,
            "Pipeline complete!",
            downloaded=scraper.stats["downloaded"],
            skipped=scraper.stats["skipped"],
            failed=scraper.stats["failed"],
            categories=summary,
            local_path=str(output_dir),
        )

    except asyncio.CancelledError:
        progress.emit(EventType.PIPELINE_ERROR, "Pipeline cancelled")
    except Exception as exc:
        logger.exception("Pipeline error")
        progress.emit(EventType.PIPELINE_ERROR, f"Pipeline error: {exc}")
    finally:
        await scraper.close()
