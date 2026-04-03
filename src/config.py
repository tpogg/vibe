import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)


class Config:
    # ExpiredDomains.net
    ED_USERNAME = os.getenv("ED_USERNAME", "")
    ED_PASSWORD = os.getenv("ED_PASSWORD", "")

    # Open PageRank
    OPENPAGERANK_API_KEY = os.getenv("OPENPAGERANK_API_KEY", "")

    # WhoisXML
    WHOISXML_API_KEY = os.getenv("WHOISXML_API_KEY", "")

    # GoDaddy
    GODADDY_API_KEY = os.getenv("GODADDY_API_KEY", "")
    GODADDY_API_SECRET = os.getenv("GODADDY_API_SECRET", "")

    # Dynadot
    DYNADOT_API_KEY = os.getenv("DYNADOT_API_KEY", "")

    # Scoring thresholds
    MIN_DOMAIN_AGE_YEARS = int(os.getenv("MIN_DOMAIN_AGE_YEARS", "3"))
    MIN_BACKLINKS = int(os.getenv("MIN_BACKLINKS", "10"))
    MIN_DOMAIN_AUTHORITY = int(os.getenv("MIN_DOMAIN_AUTHORITY", "15"))
    MAX_PRICE_USD = float(os.getenv("MAX_PRICE_USD", "500"))

    # Watchlist
    WATCHLIST_PATH = BASE_DIR / os.getenv("WATCHLIST_PATH", "data/watchlist.json")
    CHECK_INTERVAL_HOURS = int(os.getenv("CHECK_INTERVAL_HOURS", "6"))
