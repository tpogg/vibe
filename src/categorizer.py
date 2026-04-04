"""Categorizes and reorganizes downloaded files by type."""

import logging
import shutil
from pathlib import Path

from .config import FILE_CATEGORIES

logger = logging.getLogger(__name__)


def categorize_guild_files(guild_dir: Path) -> Path:
    """Reorganize a flat channel-based download tree into category-based folders.

    Input structure:
        guild_dir/
            channel_a/
                photo.png
                video.mp4
                readme.txt
            channel_b/
                song.mp3

    Output structure (written to guild_dir/_organized/):
        guild_dir/_organized/
            images/
                channel_a/
                    photo.png
            videos/
                channel_a/
                    video.mp4
            audio/
                channel_b/
                    song.mp3
            documents/
                channel_a/
                    readme.txt
            other/
                ...

    Returns the path to the organized directory.
    """
    organized_dir = guild_dir / "_organized"
    organized_dir.mkdir(exist_ok=True)

    # Build a reverse lookup: extension -> category
    ext_to_category = {}
    for category, extensions in FILE_CATEGORIES.items():
        for ext in extensions:
            ext_to_category[ext.lower()] = category

    stats: dict[str, int] = {}

    for channel_dir in guild_dir.iterdir():
        if not channel_dir.is_dir() or channel_dir.name.startswith("_"):
            continue

        for file_path in channel_dir.iterdir():
            if not file_path.is_file():
                continue

            ext = file_path.suffix.lower()
            category = ext_to_category.get(ext, "other")

            dest_dir = organized_dir / category / channel_dir.name
            dest_dir.mkdir(parents=True, exist_ok=True)

            dest_path = dest_dir / file_path.name
            if dest_path.exists():
                dest_path = _deduplicate(dest_path)

            shutil.copy2(file_path, dest_path)

            stats[category] = stats.get(category, 0) + 1

    logger.info("Categorization complete:")
    for category, count in sorted(stats.items()):
        logger.info("  %s: %d files", category, count)

    return organized_dir


def get_category_summary(organized_dir: Path) -> dict[str, list[str]]:
    """Return a summary of categorized files: {category: [filenames]}."""
    summary: dict[str, list[str]] = {}
    for category_dir in sorted(organized_dir.iterdir()):
        if not category_dir.is_dir():
            continue
        files = []
        for channel_dir in sorted(category_dir.iterdir()):
            if not channel_dir.is_dir():
                continue
            for f in sorted(channel_dir.iterdir()):
                if f.is_file():
                    files.append(f"{channel_dir.name}/{f.name}")
        if files:
            summary[category_dir.name] = files
    return summary


def _deduplicate(path: Path) -> Path:
    stem = path.stem
    suffix = path.suffix
    counter = 1
    while True:
        new_path = path.parent / f"{stem}_{counter}{suffix}"
        if not new_path.exists():
            return new_path
        counter += 1
