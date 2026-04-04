# Vibe — Discord Server Media Scraper

Download all media and files from any Discord server, categorize them, and upload organized to Google Drive. Three ways to use it:

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env

# Launch the web UI (recommended)
python -m src web
```

Open `http://localhost:8000`, paste your bot token, pick a server, and hit scrape. That's it.

## Three Modes

### 1. Web UI (`vibe web`) — Recommended

A full web dashboard where you enter credentials, pick servers/channels, and watch live progress as files are downloaded, categorized, and uploaded.

```bash
python -m src web              # http://localhost:8000
python -m src web --port 3000  # custom port
```

Features:
- Enter bot token and user ID in the browser (no .env needed)
- Browse servers and channels visually
- Configure Google Drive credentials per-scrape
- Live progress: download counter, categorization, upload status
- Real-time log stream with color-coded pipeline stages

### 2. Discord Bot (`vibe bot`)

Runs a persistent bot with `/scrape` slash commands in Discord.

```bash
python -m src bot
```

| Slash Command | Description |
|---|---|
| `/scrape` | Scrape entire server |
| `/scrape channel:#art` | Scrape one channel |
| `/scrape skip_upload:True` | Local only |
| `/scrape-status` | Show accessible channels |
| `/scrape-cancel` | Stop in-progress scrape |

### 3. CLI (`vibe scrape`)

One-shot export via [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter). No bot needed.

```bash
python -m src servers                  # list servers
python -m src scrape 123456789         # export + categorize + upload
python -m src organize ./my-files/     # categorize existing files
```

## Setup

### Prerequisites

- **Python 3.11+**
- **Discord bot token** — for web UI and bot modes ([Developer Portal](https://discord.com/developers/applications))
- **DiscordChatExporter** — for CLI mode only ([releases](https://github.com/Tyrrrz/DiscordChatExporter/releases))

### Discord Bot Setup

1. [Discord Developer Portal](https://discord.com/developers/applications) -> New Application -> Bot
2. Enable **Message Content** privileged intent
3. OAuth2 URL Generator: scopes `bot` + `applications.commands`, permissions: Read Messages, Read Message History
4. Invite to your server(s)

### Google Drive Setup (Optional)

1. [Google Cloud Console](https://console.cloud.google.com/) -> new project -> enable Drive API
2. Create Service Account -> download JSON key
3. Share target Drive folder with the service account email

## All Commands

```
python -m src web                         Launch web UI
python -m src web --port 3000             Custom port
python -m src bot                         Run Discord bot
python -m src bot --no-upload             Bot without cloud upload
python -m src servers                     List servers (DCE)
python -m src channels <server-id>        List channels (DCE)
python -m src scrape <server-id>          Full pipeline (DCE)
python -m src scrape <id> --no-upload     Local only
python -m src organize ./path/            Categorize existing files
```

## Output Structure

```
organized/ServerName/
├── images/
│   ├── general/
│   │   ├── photo.png
│   │   └── meme.jpg
│   └── art/
│       └── drawing.png
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
