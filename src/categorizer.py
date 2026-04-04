"""Categorizes and reorganizes downloaded/exported media files by type."""

import logging
import shutil
from pathlib import Path

from .config import FILE_CATEGORIES, MAX_FILE_SIZE_MB
from .progress import EventType, progress

logger = logging.getLogger(__name__)

_SKIP_EXTENSIONS = {".html", ".css"}


def _build_ext_map() -> dict[str, str]:
    ext_to_category: dict[str, str] = {}
    for category, extensions in FILE_CATEGORIES.items():
        for ext in extensions:
            ext_to_category[ext.lower()] = category
    return ext_to_category


def categorize_download(download_dir: Path, output_dir: Path) -> Path:
    """Categorize files from bot downloads (channel-based subdirectories)."""
    output_dir.mkdir(parents=True, exist_ok=True)
    ext_map = _build_ext_map()
    size_limit = MAX_FILE_SIZE_MB * 1024 * 1024 if MAX_FILE_SIZE_MB > 0 else 0
    stats: dict[str, int] = {}

    progress.emit(EventType.CATEGORIZE_START, "Categorizing downloaded files...")

    for channel_dir in download_dir.iterdir():
        if not channel_dir.is_dir() or channel_dir.name.startswith("_"):
            continue

        for file_path in channel_dir.iterdir():
            if not file_path.is_file():
                continue

            ext = file_path.suffix.lower()
            if size_limit > 0 and file_path.stat().st_size > size_limit:
                continue

            category = ext_map.get(ext, "other")
            dest_dir = output_dir / category / channel_dir.name
            dest_dir.mkdir(parents=True, exist_ok=True)

            dest_path = _deduplicate(dest_dir / file_path.name)
            shutil.copy2(file_path, dest_path)
            stats[category] = stats.get(category, 0) + 1

            progress.emit(
                EventType.CATEGORIZE_FILE,
                f"{file_path.name} → {category}",
                filename=file_path.name, category=category,
                totals=stats,
            )

    total = sum(stats.values())
    progress.emit(
        EventType.CATEGORIZE_DONE,
        f"Categorized {total} files",
        totals=stats, total=total,
    )
    return output_dir


def categorize_export(export_dir: Path, output_dir: Path) -> Path:
    """Categorize files from a DiscordChatExporter export."""
    output_dir.mkdir(parents=True, exist_ok=True)
    ext_map = _build_ext_map()
    size_limit = MAX_FILE_SIZE_MB * 1024 * 1024 if MAX_FILE_SIZE_MB > 0 else 0
    stats: dict[str, int] = {}

    progress.emit(EventType.CATEGORIZE_START, "Categorizing exported files...")

    for file_path in export_dir.rglob("*"):
        if not file_path.is_file():
            continue

        ext = file_path.suffix.lower()
        if ext in _SKIP_EXTENSIONS:
            continue
        if size_limit > 0 and file_path.stat().st_size > size_limit:
            continue

        category = ext_map.get(ext, "other")
        dest_dir = output_dir / category
        dest_dir.mkdir(exist_ok=True)

        dest_path = _deduplicate(dest_dir / file_path.name)
        shutil.copy2(file_path, dest_path)
        stats[category] = stats.get(category, 0) + 1

        progress.emit(
            EventType.CATEGORIZE_FILE,
            f"{file_path.name} → {category}",
            filename=file_path.name, category=category,
            totals=stats,
        )

    total = sum(stats.values())
    progress.emit(
        EventType.CATEGORIZE_DONE,
        f"Categorized {total} files",
        totals=stats, total=total,
    )
    return output_dir


def get_summary(organized_dir: Path) -> dict[str, int]:
    """Return a count of files per category."""
    summary: dict[str, int] = {}
    if not organized_dir.exists():
        return summary
    for category_dir in sorted(organized_dir.iterdir()):
        if category_dir.is_dir():
            count = sum(1 for f in category_dir.rglob("*") if f.is_file())
            if count > 0:
                summary[category_dir.name] = count
    return summary


def _deduplicate(path: Path) -> Path:
    if not path.exists():
        return path
    stem, suffix, counter = path.stem, path.suffix, 1
    while True:
        new_path = path.parent / f"{stem}_{counter}{suffix}"
        if not new_path.exists():
            return new_path
        counter += 1
