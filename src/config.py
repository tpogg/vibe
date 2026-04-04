import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Discord user token — used by DiscordChatExporter
# Get yours: Discord -> Dev Tools (Ctrl+Shift+I) -> Network tab -> copy Authorization header
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN", "")

# Path to DiscordChatExporter CLI executable
DCE_PATH = os.getenv("DCE_PATH", "DiscordChatExporter.Cli")

# Local directory for exports and organized output
EXPORT_DIR = Path(os.getenv("EXPORT_DIR", "./exports"))
ORGANIZED_DIR = Path(os.getenv("ORGANIZED_DIR", "./organized"))

# Google Drive
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
GOOGLE_DRIVE_ROOT_FOLDER_ID = os.getenv("GOOGLE_DRIVE_ROOT_FOLDER_ID", "")

# File size limit in MB (0 = unlimited)
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "0"))

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
