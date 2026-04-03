"""Persistent watchlist manager — tracks high-value domains over time."""

import json
from datetime import datetime, timezone
from pathlib import Path
from src.config import Config
from src.enrichment import EnrichedDomain


class Watchlist:
    """JSON-backed watchlist for tracking domain candidates."""

    def __init__(self, path: Path | None = None):
        self.path = path or Config.WATCHLIST_PATH
        self.entries: dict[str, dict] = {}
        self._load()

    def _load(self):
        if self.path.exists():
            try:
                with open(self.path, "r") as f:
                    data = json.load(f)
                self.entries = {e["name"]: e for e in data.get("domains", [])}
            except (json.JSONDecodeError, KeyError):
                self.entries = {}

    def _save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "total": len(self.entries),
            "domains": list(self.entries.values()),
        }
        with open(self.path, "w") as f:
            json.dump(data, f, indent=2, default=str)

    def add(self, domain: EnrichedDomain) -> bool:
        """Add or update a domain on the watchlist. Returns True if new."""
        is_new = domain.name not in self.entries
        entry = domain.to_dict()
        entry["added_at"] = (
            self.entries[domain.name].get("added_at", datetime.now(timezone.utc).isoformat())
            if not is_new
            else datetime.now(timezone.utc).isoformat()
        )
        entry["last_seen"] = datetime.now(timezone.utc).isoformat()
        entry["purchased"] = self.entries.get(domain.name, {}).get("purchased", False)
        self.entries[domain.name] = entry
        self._save()
        return is_new

    def remove(self, domain_name: str) -> bool:
        if domain_name in self.entries:
            del self.entries[domain_name]
            self._save()
            return True
        return False

    def mark_purchased(self, domain_name: str):
        if domain_name in self.entries:
            self.entries[domain_name]["purchased"] = True
            self.entries[domain_name]["purchased_at"] = datetime.now(timezone.utc).isoformat()
            self._save()

    def get_unpurchased(self) -> list[dict]:
        """Get all watchlist domains that haven't been purchased yet."""
        return [
            e for e in self.entries.values()
            if not e.get("purchased", False)
        ]

    def get_top(self, n: int = 20) -> list[dict]:
        """Get top N domains by score."""
        sorted_entries = sorted(
            self.entries.values(),
            key=lambda e: e.get("score", 0),
            reverse=True,
        )
        return sorted_entries[:n]

    def __len__(self):
        return len(self.entries)

    def __contains__(self, domain_name: str):
        return domain_name in self.entries
