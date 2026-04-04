import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# === Discord Bot (for `vibe bot` mode) ===
DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")
OWNER_ID = int(os.getenv("OWNER_ID", "0"))

# === Discord User Token (for `vibe scrape` CLI mode via DiscordChatExporter) ===
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN", "")
DCE_PATH = os.getenv("DCE_PATH", "DiscordChatExporter.Cli")

# === Directories ===
DOWNLOAD_DIR = Path(os.getenv("DOWNLOAD_DIR", "./downloads"))  # bot downloads
EXPORT_DIR = Path(os.getenv("EXPORT_DIR", "./exports"))        # DCE exports
ORGANIZED_DIR = Path(os.getenv("ORGANIZED_DIR", "./organized")) # categorized output

# === Google Drive ===
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
GOOGLE_DRIVE_ROOT_FOLDER_ID = os.getenv("GOOGLE_DRIVE_ROOT_FOLDER_ID", "")

# === Scraper Settings ===
MAX_CONCURRENT_DOWNLOADS = int(os.getenv("MAX_CONCURRENT_DOWNLOADS", "5"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "0"))  # 0 = unlimited

# === Category Definitions ===
FILE_CATEGORIES = {
    "images": [
        ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg", ".ico",
        ".tiff", ".tif", ".heic", ".heif", ".avif",
    ],
    "videos": [
        ".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v",
        ".mpeg", ".mpg", ".3gp",
    ],
    "audio": [
        ".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a", ".opus",
        ".aiff",
    ],
    "documents": [
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".txt", ".rtf", ".odt", ".ods", ".odp", ".csv", ".tsv",
    ],
    "archives": [
        ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".tar.gz",
        ".tar.bz2", ".tar.xz",
    ],
    "code": [
        ".py", ".js", ".ts", ".java", ".cpp", ".c", ".h", ".cs", ".rb",
        ".go", ".rs", ".php", ".html", ".css", ".json", ".xml", ".yaml",
        ".yml", ".toml", ".sh", ".bat", ".sql",
    ],
}
