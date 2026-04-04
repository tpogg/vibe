# Vibe — Discord Media Scraper

A Discord bot that automatically scrapes all media and files from server channels, categorizes them by type, and uploads them to Google Drive in an organized folder structure.

## How It Works

1. **Scrape** — When the bot joins a server (or on-demand), it iterates through all accessible text channels and downloads every attachment and embedded media file.
2. **Categorize** — Downloaded files are organized into folders by type: `images/`, `videos/`, `audio/`, `documents/`, `archives/`, `code/`, and `other/`.
3. **Upload** — The organized file tree is uploaded to Google Drive, preserving the category and channel folder structure.

## Setup

### Prerequisites

- Python 3.11+
- A Discord bot token
- A Google Cloud service account with Drive API enabled (for cloud upload)

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

- **`DISCORD_BOT_TOKEN`** — Create a bot at the [Discord Developer Portal](https://discord.com/developers/applications). Enable the `MESSAGE_CONTENT` privileged intent.
- **`GOOGLE_CREDENTIALS_FILE`** — Path to your Google Cloud service account JSON key file.
- **`GOOGLE_DRIVE_ROOT_FOLDER_ID`** — The ID of the Google Drive folder to upload into (from the folder's URL). Share this folder with your service account email.

### 3. Create the Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and add a Bot
3. Enable these **Privileged Gateway Intents**:
   - Message Content Intent
4. Generate an invite URL with these **permissions**:
   - Read Messages/View Channels
   - Read Message History
5. Use the invite URL to add the bot to your server(s)

### 4. Set Up Google Drive (Optional)

If you want cloud upload:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Google Drive API**
3. Create a **Service Account** and download the JSON key file
4. Share your target Google Drive folder with the service account's email address

## Usage

```bash
# Start the bot (auto-scrapes when joining new servers)
python -m src.bot

# Start and scrape all servers the bot is already in
python -m src.bot --scrape-existing

# Scrape without uploading to Google Drive (local files only)
python -m src.bot --no-upload

# Enable verbose/debug logging
python -m src.bot -v
```

## Output Structure

Files are organized locally and on Google Drive like this:

```
ServerName/_organized/
├── images/
│   ├── general/
│   │   ├── photo1.png
│   │   └── meme.jpg
│   └── art-channel/
│       └── drawing.png
├── videos/
│   └── general/
│       └── clip.mp4
├── audio/
│   └── music/
│       └── song.mp3
├── documents/
│   └── resources/
│       └── guide.pdf
├── archives/
├── code/
└── other/
```

## Configuration

All settings are in `.env`. Key options:

| Variable | Default | Description |
|---|---|---|
| `SCRAPE_ON_JOIN` | `true` | Auto-scrape when bot joins a server |
| `SCRAPE_HISTORY_LIMIT` | `0` | Max messages per channel (0 = all) |
| `MAX_FILE_SIZE_MB` | `100` | Skip files larger than this |
| `MAX_CONCURRENT_DOWNLOADS` | `5` | Parallel download limit |
