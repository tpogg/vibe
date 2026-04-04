"""Wraps DiscordChatExporter CLI to export media from Discord servers."""

import json
import logging
import subprocess
from pathlib import Path

from .config import DCE_PATH, DISCORD_TOKEN, EXPORT_DIR

logger = logging.getLogger(__name__)


class ExportError(Exception):
    pass


def _run_dce(args: list[str]) -> subprocess.CompletedProcess:
    """Run a DiscordChatExporter CLI command."""
    cmd = [DCE_PATH, *args, "--token", DISCORD_TOKEN]
    logger.debug("Running: %s", " ".join(cmd[:2]) + " ...")

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise ExportError(
            f"DiscordChatExporter failed (exit {result.returncode}):\n{result.stderr}"
        )
    return result


def list_guilds() -> list[dict]:
    """List all guilds (servers) accessible with the configured token.

    Returns a list of dicts with 'id' and 'name' keys.
    """
    result = _run_dce(["guilds", "--output-format", "Json"])
    guilds = json.loads(result.stdout)
    return [{"id": g["id"], "name": g["name"]} for g in guilds]


def list_channels(guild_id: str) -> list[dict]:
    """List all text channels in a guild.

    Returns a list of dicts with 'id', 'name', and 'category' keys.
    """
    result = _run_dce(["channels", "--guild", guild_id, "--output-format", "Json"])
    channels = json.loads(result.stdout)
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "category": c.get("category", ""),
        }
        for c in channels
    ]


def export_guild(guild_id: str, guild_name: str) -> Path:
    """Export all channels in a guild, downloading all media.

    Returns the path to the export output directory.
    """
    output_dir = EXPORT_DIR / _sanitize(guild_name)
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Exporting all channels from '%s' ...", guild_name)

    _run_dce([
        "exportguild",
        "--guild", guild_id,
        "--output", str(output_dir / "%C - %c.html"),
        "--media",
        "--reuse-media",
        "--media-dir", str(output_dir / "media"),
        "--format", "HtmlDark",
    ])

    logger.info("Export complete: %s", output_dir)
    return output_dir


def export_channel(channel_id: str, output_dir: Path) -> Path:
    """Export a single channel, downloading all media.

    Returns the path to the export output directory.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    _run_dce([
        "export",
        "--channel", channel_id,
        "--output", str(output_dir / "%C - %c.html"),
        "--media",
        "--reuse-media",
        "--media-dir", str(output_dir / "media"),
        "--format", "HtmlDark",
    ])

    return output_dir


def export_channels(channel_ids: list[str], guild_name: str) -> Path:
    """Export specific channels, downloading all media.

    Returns the path to the export output directory.
    """
    output_dir = EXPORT_DIR / _sanitize(guild_name)
    output_dir.mkdir(parents=True, exist_ok=True)

    for channel_id in channel_ids:
        logger.info("Exporting channel %s ...", channel_id)
        export_channel(channel_id, output_dir)

    logger.info("Export complete: %s", output_dir)
    return output_dir


def _sanitize(name: str) -> str:
    return "".join(c if c.isalnum() or c in ("-", "_", " ") else "_" for c in name).strip()
