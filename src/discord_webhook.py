"""Discord webhook integration for domain alerts."""

import os
import traceback
import requests


DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")


def _post(payload: dict) -> bool:
    """Post a payload to the Discord webhook. Returns True on success."""
    if not DISCORD_WEBHOOK_URL:
        print("[discord] DISCORD_WEBHOOK_URL not set — skipping")
        return False
    try:
        resp = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10)
        if resp.status_code in (200, 204):
            print("[discord] Message sent OK")
            return True
        else:
            print(f"[discord] HTTP {resp.status_code}: {resp.text[:200]}")
            return False
    except Exception as e:
        print(f"[discord] Error: {e}")
        return False


def send_scan_summary(domains_found: int, domains_tracked: int, top: list[dict]):
    """Post scan results to Discord."""
    if not DISCORD_WEBHOOK_URL:
        return

    # Build top 5 list
    top_text = ""
    for i, d in enumerate(top[:5], 1):
        name = d.get("name", "?")
        score = d.get("score", 0)
        bl = d.get("backlinks", 0)
        tf = d.get("trust_flow", 0)
        top_text += f"`{i}.` **{name}** — score: {score} | BL: {bl} | TF: {tf}\n"

    if not top_text:
        top_text = "No domains scored above 0"

    embed = {
        "title": "Domain Scan Complete",
        "color": 0x3498DB,
        "fields": [
            {"name": "Scraped", "value": str(domains_found), "inline": True},
            {"name": "Tracked", "value": str(domains_tracked), "inline": True},
            {"name": "Top 5", "value": top_text, "inline": False},
        ],
        "footer": {"text": "Domain Watchlist Bot"},
    }

    # Flag dropping domains
    dropping = [d for d in top if d.get("status") == "pending_delete"]
    if dropping:
        drop_text = "\n".join(
            f"**{d.get('name')}** (score: {d.get('score', 0)})"
            for d in dropping[:5]
        )
        embed["fields"].append({"name": "Dropping Soon", "value": drop_text, "inline": False})
        embed["color"] = 0xFF4444

    _post({"embeds": [embed]})


def send_discord_alert(domains: list[dict], title: str = "Domain Alert"):
    """Send an alert embed for high-value domains."""
    if not DISCORD_WEBHOOK_URL or not domains:
        return

    fields = []
    for d in domains[:10]:
        name = d.get("name", "?")
        score = d.get("score", 0)
        bl = d.get("backlinks", 0)
        tf = d.get("trust_flow", 0)
        pr = d.get("page_rank", 0)
        age = d.get("domain_age_years", 0)
        status = d.get("status", "")

        lines = f"Score: **{score}** | BL: {bl} | TF: {tf} | PR: {pr}"
        if age > 0:
            lines += f" | Age: {age:.0f}yr"
        lines += f" | `{status}`"
        fields.append({"name": name, "value": lines, "inline": False})

    embed = {
        "title": title,
        "color": 0x00FF88,
        "fields": fields,
        "footer": {"text": f"{len(domains)} domains"},
    }

    _post({"embeds": [embed]})
