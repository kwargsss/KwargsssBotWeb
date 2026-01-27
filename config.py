import os
from dotenv import load_dotenv
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

load_dotenv()

API_SECRET = os.getenv("API_SECRET")
SESSION_SECRET = os.getenv("SESSION_SECRET")

DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

SUPER_ADMIN_ID = os.getenv("SUPER_ADMIN_ID")
TARGET_GUILD_ID = int(os.getenv("TARGET_GUILD_ID", 0))

TG_LOG_TOKEN = os.getenv("TG_LOG_TOKEN")
TG_LOG_CHAT_ID = os.getenv("TG_LOG_CHAT_ID")

BOT_TOKEN = os.getenv("BOT_TOKEN")

DB_FILE = str(BASE_DIR / "database.db")