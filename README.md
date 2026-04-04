# Vibe — Discord Server Media Scraper

A CLI tool that downloads all media and files from any Discord server you're in, categorizes them by type, and uploads them organized to Google Drive.

Uses [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter) under the hood for the Discord export — no bots to invite, no extra accounts. Just you, your token, and a command.

## Quick Start

```bash
# 1. Install
pip install -r requirements.txt
cp .env.example .env          # fill in DISCORD_TOKEN

# 2. See your servers
python -m src servers

# 3. Scrape one
python -m src scrape <server-id>
```

That's it. Media gets downloaded, sorted into `images/`, `videos/`, `audio/`, `documents/`, etc., and (optionally) uploaded to your Google Drive.

## Setup

### Prerequisites

- **Python 3.11+**
- **DiscordChatExporter CLI** — [Download here](https://github.com/Tyrrrz/DiscordChatExporter/releases)
  - On Linux/macOS you also need the .NET 8 runtime
  - Or use the Docker image: `docker pull tyrrrz/discordchatexporter`

### Install

```bash
git clone https://github.com/tpogg/vibe.git
cd vibe
pip install -r requirements.txt
cp .env.example .env
```

### Get Your Discord Token

1. Open Discord **in your browser** (not the desktop app)
2. Press `F12` to open DevTools
3. Go to the **Network** tab
4. Send a message in any channel
5. Click any request to `discord.com` in the Network tab
6. Find the `Authorization` header — that's your token
7. Paste it into `.env` as `DISCORD_TOKEN`

### Set Up Google Drive (Optional)

Only needed if you want cloud upload. Skip if you just want local files.

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Google Drive API**
3. Create a **Service Account** and download the JSON key
4. Share your target Drive folder with the service account's email
5. Set `GOOGLE_CREDENTIALS_FILE` and `GOOGLE_DRIVE_ROOT_FOLDER_ID` in `.env`

## Commands

### `vibe servers` — List your servers

```bash
python -m src servers
```

Shows all servers you're in with their IDs.

### `vibe channels <server-id>` — List channels

```bash
python -m src channels 123456789012345678
```

Shows all text channels in a server, grouped by category.

### `vibe scrape <server-id>` — Full pipeline

```bash
# Scrape entire server -> categorize -> upload to Drive
python -m src scrape 123456789012345678

# Scrape specific channels only
python -m src scrape 123456789012345678 --channels 111111 222222 333333

# Scrape but keep local only (no cloud upload)
python -m src scrape 123456789012345678 --no-upload
```

### `vibe organize <directory>` — Categorize existing files

Already have exported files? Skip the export step:

```bash
# Categorize and upload
python -m src organize ./my-export/

# Categorize to a specific output directory, no upload
python -m src organize ./my-export/ --output ./sorted/ --no-upload
```

## Output Structure

```
organized/
└── ServerName/
    ├── images/
    │   ├── photo.png
    │   ├── meme.jpg
    │   └── screenshot.png
    ├── videos/
    │   ├── clip.mp4
    │   └── recording.webm
    ├── audio/
    │   └── song.mp3
    ├── documents/
    │   ├── guide.pdf
    │   └── notes.txt
    ├── archives/
    │   └── backup.zip
    ├── code/
    │   └── script.py
    └── other/
        └── data.bin
```

The same structure is mirrored on Google Drive when upload is enabled.

## Configuration

All settings in `.env`:

| Variable | Default | Description |
|---|---|---|
| `DISCORD_TOKEN` | *(required)* | Your Discord token |
| `DCE_PATH` | `DiscordChatExporter.Cli` | Path to DCE executable |
| `EXPORT_DIR` | `./exports` | Raw export staging directory |
| `ORGANIZED_DIR` | `./organized` | Categorized output directory |
| `MAX_FILE_SIZE_MB` | `0` (unlimited) | Skip files larger than this |
| `GOOGLE_CREDENTIALS_FILE` | `credentials.json` | Service account key path |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | *(optional)* | Target Drive folder ID |
