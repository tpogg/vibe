"""Categorizes and reorganizes exported media files by type."""

import logging
import shutil
from pathlib import Path

from .config import FILE_CATEGORIES, MAX_FILE_SIZE_MB

logger = logging.getLogger(__name__)


def categorize_export(export_dir: Path, output_dir: Path) -> Path:
    """Scan an export directory for media files and organize them by category.

    DiscordChatExporter puts downloaded media in a 'media/' subdirectory.
    This function finds ALL files (in media/ and anywhere else), categorizes
    them by extension, and copies them into an organized tree.

    Output structure:
        output_dir/
            images/
                photo.png
                meme.jpg
            videos/
                clip.mp4
            audio/
                song.mp3
            documents/
                guide.pdf
            other/
                unknown.bin

    Returns the output directory path.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # Build reverse lookup: extension -> category
    ext_to_category: dict[str, str] = {}
    for category, extensions in FILE_CATEGORIES.items():
        for ext in extensions:
            ext_to_category[ext.lower()] = category

    stats: dict[str, int] = {}
    size_limit = MAX_FILE_SIZE_MB * 1024 * 1024 if MAX_FILE_SIZE_MB > 0 else 0

    # Walk the entire export tree for media files
    # Skip .html export files — we only want actual media/attachments
    skip_extensions = {".html", ".css"}

    for file_path in export_dir.rglob("*"):
        if not file_path.is_file():
            continue

        ext = file_path.suffix.lower()
        if ext in skip_extensions:
            continue

        # Skip files over size limit
        if size_limit > 0 and file_path.stat().st_size > size_limit:
            logger.debug("Skipping %s — exceeds size limit", file_path.name)
            continue

        category = ext_to_category.get(ext, "other")
        dest_dir = output_dir / category
        dest_dir.mkdir(exist_ok=True)

        dest_path = dest_dir / file_path.name
        if dest_path.exists():
            dest_path = _deduplicate(dest_path)

        shutil.copy2(file_path, dest_path)
        stats[category] = stats.get(category, 0) + 1

    total = sum(stats.values())
    logger.info("Categorized %d files:", total)
    for category, count in sorted(stats.items()):
        logger.info("  %s: %d", category, count)

    return output_dir


def get_summary(organized_dir: Path) -> dict[str, int]:
    """Return a count of files per category."""
    summary: dict[str, int] = {}
    for category_dir in sorted(organized_dir.iterdir()):
        if category_dir.is_dir():
            count = sum(1 for f in category_dir.iterdir() if f.is_file())
            if count > 0:
                summary[category_dir.name] = count
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
