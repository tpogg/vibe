# Vibe — Discord Media Scraper

A Discord bot you control with slash commands. Join any server, invite the bot, run `/scrape`, and it downloads every media file and attachment, categorizes them by type, and uploads them organized to your Google Drive.

## How It Works

1. You join a Discord server and invite the bot to the same server
2. Run `/scrape` — the bot walks all accessible text channels, downloading every attachment and embedded media
3. Files are categorized into folders: `images/`, `videos/`, `audio/`, `documents/`, `archives/`, `code/`, `other/`
4. The organized tree is uploaded to your Google Drive

## Commands

| Command | Description |
|---|---|
| `/scrape` | Scrape entire server and upload to Drive |
| `/scrape channel:#general` | Scrape only one channel |
| `/scrape skip_upload:True` | Download and organize locally, skip cloud upload |
| `/scrape limit:1000` | Only scan the last 1000 messages per channel |
| `/scrape-status` | Show which channels the bot can access |
| `/scrape-cancel` | Cancel an in-progress scrape |

Only the configured `OWNER_ID` can run these commands.

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

| Variable | Required | Description |
|---|---|---|
| `DISCORD_BOT_TOKEN` | Yes | Bot token from [Discord Developer Portal](https://discord.com/developers/applications) |
| `OWNER_ID` | Yes | Your Discord user ID (right-click your name -> Copy User ID) |
| `GOOGLE_CREDENTIALS_FILE` | For upload | Path to Google Cloud service account JSON key |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | For upload | Target Drive folder ID (from the folder URL) |

### 3. Create the Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and add a Bot
3. Enable **Privileged Gateway Intents**:
   - Message Content Intent
4. Generate an invite URL under OAuth2 -> URL Generator:
   - **Scopes:** `bot`, `applications.commands`
   - **Permissions:** Read Messages/View Channels, Read Message History
5. Use the invite URL to add the bot to your server(s)

### 4. Set Up Google Drive (Optional)

Skip this if you only want local downloads (`/scrape skip_upload:True` or `--no-upload`).

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Google Drive API**
3. Create a **Service Account** and download the JSON key file
4. Share your target Google Drive folder with the service account's email address
5. Copy the folder ID from the Drive URL and set `GOOGLE_DRIVE_ROOT_FOLDER_ID`

## Usage

```bash
# Start the bot
python -m src.bot

# Start without cloud upload capability
python -m src.bot --no-upload

# Enable verbose/debug logging
python -m src.bot -v
```

Then in Discord, just type `/scrape` in any server the bot is in.

## Output Structure

Files are organized locally (in `./downloads/`) and on Google Drive like this:

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
| `SCRAPE_HISTORY_LIMIT` | `0` | Default max messages per channel (0 = all) |
| `MAX_FILE_SIZE_MB` | `100` | Skip files larger than this |
| `MAX_CONCURRENT_DOWNLOADS` | `5` | Parallel download limit |
| `DOWNLOAD_DIR` | `./downloads` | Local staging directory |
