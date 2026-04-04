"""Uploads organized files to Google Drive, preserving folder structure."""

import logging
from pathlib import Path

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

from .config import GOOGLE_CREDENTIALS_FILE, GOOGLE_DRIVE_ROOT_FOLDER_ID

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/drive"]

# Mapping of file extensions to MIME types for common media
MIME_OVERRIDES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".mkv": "video/x-matroska",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".flac": "audio/flac",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".pdf": "application/pdf",
    ".zip": "application/zip",
    ".json": "application/json",
    ".txt": "text/plain",
    ".csv": "text/csv",
}


class GoogleDriveUploader:
    """Uploads a local directory tree to Google Drive."""

    def __init__(self):
        creds = Credentials.from_service_account_file(
            GOOGLE_CREDENTIALS_FILE, scopes=SCOPES
        )
        self._service = build("drive", "v3", credentials=creds)
        self._folder_cache: dict[str, str] = {}
        self.stats = {"uploaded": 0, "failed": 0}

    def upload_directory(self, local_dir: Path, parent_folder_id: str = "") -> str:
        """Upload an entire directory tree to Google Drive.

        Returns the Google Drive folder ID of the root upload folder.
        """
        parent_id = parent_folder_id or GOOGLE_DRIVE_ROOT_FOLDER_ID
        if not parent_id:
            raise ValueError(
                "No Google Drive root folder ID configured. "
                "Set GOOGLE_DRIVE_ROOT_FOLDER_ID in your .env file."
            )

        root_id = self._create_folder(local_dir.name, parent_id)
        self._upload_tree(local_dir, root_id)

        logger.info(
            "Upload complete — uploaded: %d, failed: %d",
            self.stats["uploaded"],
            self.stats["failed"],
        )
        return root_id

    def _upload_tree(self, local_dir: Path, drive_folder_id: str):
        """Recursively upload files and subdirectories."""
        for item in sorted(local_dir.iterdir()):
            if item.is_dir():
                sub_folder_id = self._create_folder(item.name, drive_folder_id)
                self._upload_tree(item, sub_folder_id)
            elif item.is_file():
                self._upload_file(item, drive_folder_id)

    def _create_folder(self, name: str, parent_id: str) -> str:
        """Create a folder in Google Drive (or return cached ID if exists)."""
        cache_key = f"{parent_id}/{name}"
        if cache_key in self._folder_cache:
            return self._folder_cache[cache_key]

        # Check if folder already exists
        query = (
            f"name = '{name}' and '{parent_id}' in parents "
            f"and mimeType = 'application/vnd.google-apps.folder' "
            f"and trashed = false"
        )
        results = (
            self._service.files()
            .list(q=query, spaces="drive", fields="files(id, name)")
            .execute()
        )
        existing = results.get("files", [])
        if existing:
            folder_id = existing[0]["id"]
        else:
            metadata = {
                "name": name,
                "mimeType": "application/vnd.google-apps.folder",
                "parents": [parent_id],
            }
            folder = (
                self._service.files()
                .create(body=metadata, fields="id")
                .execute()
            )
            folder_id = folder["id"]
            logger.debug("Created Drive folder: %s", name)

        self._folder_cache[cache_key] = folder_id
        return folder_id

    def _upload_file(self, file_path: Path, parent_id: str):
        """Upload a single file to Google Drive."""
        try:
            mime_type = MIME_OVERRIDES.get(
                file_path.suffix.lower(), "application/octet-stream"
            )

            metadata = {
                "name": file_path.name,
                "parents": [parent_id],
            }

            media = MediaFileUpload(
                str(file_path),
                mimetype=mime_type,
                resumable=True,
            )

            self._service.files().create(
                body=metadata, media_body=media, fields="id"
            ).execute()

            self.stats["uploaded"] += 1
            logger.debug("Uploaded: %s", file_path.name)

        except Exception:
            logger.exception("Failed to upload %s", file_path.name)
            self.stats["failed"] += 1
