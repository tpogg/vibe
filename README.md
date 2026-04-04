# Vibe — Discord Server Media Scraper

Two ways to download all media from Discord servers, categorize it, and upload it organized to Google Drive.

## Two Modes

### Mode 1: Bot (`vibe bot`)

A Discord bot you invite to servers. Use `/scrape` slash commands to download, categorize, and upload — all from within Discord with live progress updates.

```bash
python -m src bot
```

Then in Discord: `/scrape` to grab everything, `/scrape channel:#art` for one channel, `/scrape-status` to check access.

### Mode 2: CLI (`vibe scrape`)

A one-shot CLI tool powered by [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter). No bot to invite — uses your Discord token directly.

```bash
python -m src servers                      # list your servers
python -m src scrape 123456789012345678     # scrape one
```

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in your tokens
```

**For bot mode:** set `DISCORD_BOT_TOKEN` + `OWNER_ID`
**For CLI mode:** set `DISCORD_TOKEN` + install [DiscordChatExporter CLI](https://github.com/Tyrrrz/DiscordChatExporter/releases)
**For cloud upload:** set `GOOGLE_CREDENTIALS_FILE` + `GOOGLE_DRIVE_ROOT_FOLDER_ID`

## Commands

```
vibe bot                          Start the Discord bot
vibe bot --no-upload              Start bot without cloud upload

vibe servers                      List servers (CLI/DCE)
vibe channels <server-id>         List channels in a server
vibe scrape <server-id>           Export -> categorize -> upload
vibe scrape <id> --channels X Y   Scrape specific channels only
vibe scrape <id> --no-upload      Keep files local

vibe organize ./path/             Categorize existing files + upload
vibe organize ./path/ --no-upload Categorize only, no upload
```

### Bot Slash Commands (in Discord)

| Command | Description |
|---|---|
| `/scrape` | Scrape entire server -> categorize -> upload |
| `/scrape channel:#general` | Scrape one channel |
| `/scrape skip_upload:True` | Local only, no cloud |
| `/scrape limit:1000` | Scan last 1000 messages per channel |
| `/scrape-status` | Show accessible channels |
| `/scrape-cancel` | Stop in-progress scrape |

## Setup

### Discord Bot (Mode 1)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create application -> Bot -> enable **Message Content Intent**
3. OAuth2 URL Generator: scopes `bot` + `applications.commands`, permissions: Read Messages, Read Message History
4. Invite bot to your server(s)
5. Set `DISCORD_BOT_TOKEN` and `OWNER_ID` in `.env`

### DiscordChatExporter (Mode 2)

1. [Download DCE CLI](https://github.com/Tyrrrz/DiscordChatExporter/releases) (needs .NET 8 runtime on Linux/macOS)
2. Get your Discord token: browser DevTools (F12) -> Network -> `Authorization` header
3. Set `DISCORD_TOKEN` and `DCE_PATH` in `.env`

### Google Drive (Optional)

1. [Google Cloud Console](https://console.cloud.google.com/) -> create project -> enable Drive API
2. Create Service Account -> download JSON key
3. Share your target Drive folder with the service account email
4. Set `GOOGLE_CREDENTIALS_FILE` and `GOOGLE_DRIVE_ROOT_FOLDER_ID` in `.env`

## Output

```
organized/ServerName/
├── images/
│   ├── photo.png
│   └── meme.jpg
├── videos/
│   └── clip.mp4
├── audio/
│   └── song.mp3
├── documents/
│   └── guide.pdf
├── archives/
├── code/
└── other/
```

Bot mode preserves channel subfolders (`images/general/photo.png`). CLI mode uses a flat structure per category.
