"""
VIBE Terminal Telegram Bot

A Telegram bot that:
- Forwards messages to you from visitors
- Posts updates to your Telegram channel
- Responds with terminal-style vibes

Setup:
  1. Message @BotFather on Telegram → /newbot → get your API token
  2. Create a channel (e.g. @vibeterminal) and add the bot as admin
  3. Copy .env.example to .env and fill in your values
  4. pip install python-telegram-bot python-dotenv
  5. python bot/vibe_bot.py
"""

import os
import logging
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

load_dotenv()

BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
CHANNEL_ID = os.environ.get("TELEGRAM_CHANNEL_ID", "")  # e.g. "@vibeterminal" or "-100xxxxxxxxxx"
OWNER_CHAT_ID = os.environ.get("TELEGRAM_OWNER_CHAT_ID", "")  # your personal chat ID

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


# ─── Command handlers ────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
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
    await update.message.reply_text(welcome)


async def cmd_about(update: Update, context: ContextTypes.DEFAULT_TYPE):
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
    await update.message.reply_text(about)


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


async def cmd_fortune(update: Update, context: ContextTypes.DEFAULT_TYPE):
    import random
    fortune = random.choice(FORTUNES)
    await update.message.reply_text(f"🔮 {fortune}")


async def cmd_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact = (
        "┌─ CONTACT ─────────────────────────┐\n"
        "│  github   : github.com/tpogg/vibe │\n"
        "│  email    : hello@vibe.terminal    │\n"
        "│  telegram : t.me/+1uBHW1JjfFNiNGM5 │\n"
        "└────────────────────────────────────┘"
    )
    await update.message.reply_text(contact)


# ─── Message forwarding ──────────────────────────────────────────────────────

async def forward_to_owner(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Forward any DM to the bot owner."""
    if not OWNER_CHAT_ID:
        await update.message.reply_text("Message received! The operator will see it soon.")
        return

    user = update.effective_user
    header = f"📨 Message from {user.full_name} (@{user.username or 'no-username'}, id:{user.id}):"
    await context.bot.send_message(
        chat_id=OWNER_CHAT_ID,
        text=f"{header}\n\n{update.message.text}",
    )
    await update.message.reply_text("Message forwarded to the operator. Stand by.")


# ─── Channel posting helper ──────────────────────────────────────────────────

async def post_to_channel(context: ContextTypes.DEFAULT_TYPE, text: str):
    """Utility to post a message to the channel. Call from a job or handler."""
    if CHANNEL_ID:
        await context.bot.send_message(chat_id=CHANNEL_ID, text=text)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("about", cmd_about))
    app.add_handler(CommandHandler("fortune", cmd_fortune))
    app.add_handler(CommandHandler("contact", cmd_contact))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, forward_to_owner))

    logger.info("VIBE bot is running...")
    app.run_polling()


if __name__ == "__main__":
    main()
