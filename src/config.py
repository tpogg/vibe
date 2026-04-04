import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Discord
DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")

# Local staging directory for downloads before cloud upload
DOWNLOAD_DIR = Path(os.getenv("DOWNLOAD_DIR", "./downloads"))

# Google Drive
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
GOOGLE_DRIVE_ROOT_FOLDER_ID = os.getenv("GOOGLE_DRIVE_ROOT_FOLDER_ID", "")

# Scraper settings
MAX_CONCURRENT_DOWNLOADS = int(os.getenv("MAX_CONCURRENT_DOWNLOADS", "5"))
SCRAPE_ON_JOIN = os.getenv("SCRAPE_ON_JOIN", "true").lower() == "true"
SCRAPE_HISTORY_LIMIT = int(os.getenv("SCRAPE_HISTORY_LIMIT", "0"))  # 0 = unlimited

# File size limit in MB (0 = unlimited)
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "100"))

# Category definitions: category name -> list of extensions
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
