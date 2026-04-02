"""
VIBE Terminal Telegram Bot

A Telegram bot that:
- Forwards messages to you from visitors
- Posts updates to your Telegram channel
- Responds with terminal-style vibes

Setup:
  1. Message @BotFather on Telegram -> /newbot -> get your API token
  2. Create a channel and add the bot as admin
  3. Copy .env.example to .env and fill in your values
  4. pip install httpx python-dotenv
  5. python bot/vibe_bot.py
"""

import os
import asyncio
import random
import logging
from dotenv import load_dotenv
import httpx

load_dotenv()

BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
CHANNEL_ID = os.environ.get("TELEGRAM_CHANNEL_ID", "")
OWNER_CHAT_ID = os.environ.get("TELEGRAM_OWNER_CHAT_ID", "")
API = f"https://api.telegram.org/bot{BOT_TOKEN}"

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

FORTUNES = [
    "The best code is the code you never have to write.",
    "It works on my machine. Ship the machine.",
    "Debugging is like being a detective in a crime movie where you are also the murderer.",
    "The first 90% takes 90% of the time. The last 10% takes the other 90%.",
    "There are 2 hard problems in computer science: caching, naming things, and off-by-one errors.",
    "The cloud is just someone else's computer — and it's on fire.",
    "Ship fast, but not so fast you forget to test.",
    "\"Works for me\" is not a valid deployment strategy.",
]


async def send_message(client: httpx.AsyncClient, chat_id, text: str):
    resp = await client.post(f"{API}/sendMessage", json={"chat_id": chat_id, "text": text})
    return resp.json()


async def handle_update(client: httpx.AsyncClient, update: dict):
    msg = update.get("message")
    if not msg:
        return

    chat_id = msg["chat"]["id"]
    text = msg.get("text", "")
    user = msg.get("from", {})
    username = user.get("username", "no-username")
    full_name = user.get("first_name", "") + " " + user.get("last_name", "")
    full_name = full_name.strip()

    if text == "/start":
        welcome = (
            "██╗   ██╗██╗██████╗ ███████╗\n"
            "██║   ██║██║██╔══██╗██╔════╝\n"
            "██║   ██║██║██████╔╝█████╗\n"
            "╚██╗ ██╔╝██║██╔══██╗██╔══╝\n"
            " ╚████╔╝ ██║██████╔╝███████╗\n"
            "  ╚═══╝  ╚═╝╚═════╝ ╚══════╝\n"
            "\n"
            "Welcome to VIBE TERMINAL bot.\n"
            "\n"
            "Commands:\n"
            "/start   - this message\n"
            "/about   - about the operator\n"
            "/fortune - random dev wisdom\n"
            "/contact - get in touch\n"
            "\n"
            "Or just send a message — it'll be forwarded to the operator."
        )
        await send_message(client, chat_id, welcome)

    elif text == "/about":
        about = (
            "╔══════════════════════════════════════╗\n"
            "║           ABOUT THE OPERATOR         ║\n"
            "╠══════════════════════════════════════╣\n"
            "║  NAME     : vibe.operator            ║\n"
            "║  STATUS   : caffeine-dependent       ║\n"
            "║  LOCATION : somewhere on the grid    ║\n"
            "║  MISSION  : build cool things        ║\n"
            "╚══════════════════════════════════════╝"
        )
        await send_message(client, chat_id, about)

    elif text == "/fortune":
        fortune = random.choice(FORTUNES)
        await send_message(client, chat_id, f"🔮 {fortune}")

    elif text == "/contact":
        contact = (
            "┌─ CONTACT ─────────────────────────┐\n"
            "│  github   : github.com/tpogg/vibe │\n"
            "│  email    : hello@vibe.terminal    │\n"
            "│  telegram : t.me/+1uBHW1JjfFNiNGM5 │\n"
            "└────────────────────────────────────┘"
        )
        await send_message(client, chat_id, contact)

    elif not text.startswith("/"):
        # Forward message to owner
        if OWNER_CHAT_ID:
            header = f"📨 Message from {full_name} (@{username}, id:{user.get('id')}):"
            await send_message(client, OWNER_CHAT_ID, f"{header}\n\n{text}")
            await send_message(client, chat_id, "Message forwarded to the operator. Stand by.")
        else:
            await send_message(client, chat_id, "Message received! The operator will see it soon.")


async def poll():
    offset = 0
    async with httpx.AsyncClient(timeout=60) as client:
        logger.info("VIBE bot is running... polling for updates")
        while True:
            try:
                resp = await client.get(
                    f"{API}/getUpdates",
                    params={"offset": offset, "timeout": 30},
                    timeout=60,
                )
                data = resp.json()
                if not data.get("ok"):
                    logger.error("API error: %s", data)
                    await asyncio.sleep(5)
                    continue

                for update in data.get("result", []):
                    offset = update["update_id"] + 1
                    await handle_update(client, update)

            except httpx.TimeoutException:
                continue
            except Exception as e:
                logger.error("Error: %s", e)
                await asyncio.sleep(5)


async def post_to_channel(text: str):
    """Utility to post a message to the channel."""
    if CHANNEL_ID:
        async with httpx.AsyncClient() as client:
            await send_message(client, CHANNEL_ID, text)


if __name__ == "__main__":
    asyncio.run(poll())
