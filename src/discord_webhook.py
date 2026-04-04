"""Discord webhook integration for domain alerts."""

import os
import requests
from src.config import Config


DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")


def send_discord_alert(domains: list[dict], title: str = "Domain Watchlist Alert"):
    """Send a formatted embed to Discord with domain findings."""
    webhook_url = DISCORD_WEBHOOK_URL
    if not webhook_url:
        print("[discord] No DISCORD_WEBHOOK_URL configured, skipping")
        return

    if not domains:
        return

    # Build embed fields from top domains
    fields = []
    for d in domains[:10]:
        score = d.get("score", 0)
        status = d.get("status", "")
        bl = d.get("backlinks", 0)
        tf = d.get("trust_flow", 0)
        age = d.get("domain_age_years", 0)

        value = f"Score: **{score}** | BL: {bl} | TF: {tf} | Age: {age}yr | Status: {status}"
        fields.append({"name": d.get("name", "unknown"), "value": value, "inline": False})

    embed = {
        "title": title,
        "color": 0x00FF88,
        "fields": fields,
        "footer": {"text": f"Domain Watchlist Bot | {len(domains)} domains"},
    }

    payload = {"embeds": [embed]}

    try:
        resp = requests.post(webhook_url, json=payload, timeout=10)
        if resp.status_code in (200, 204):
            print(f"[discord] Alert sent: {len(fields)} domains")
        else:
            print(f"[discord] Failed: HTTP {resp.status_code}")
    except requests.RequestException as e:
        print(f"[discord] Error: {e}")


def send_scan_summary(domains_found: int, domains_tracked: int, top: list[dict]):
    """Send a scan completion summary to Discord."""
    webhook_url = DISCORD_WEBHOOK_URL
    if not webhook_url:
        return

    # Top 5 as a formatted list
    top_list = ""
    for i, d in enumerate(top[:5], 1):
        top_list += f"{i}. **{d.get('name')}** — score: {d.get('score', 0)}\n"

    embed = {
        "title": "Scan Complete",
        "color": 0x3498DB,
        "fields": [
            {"name": "Domains Found", "value": str(domains_found), "inline": True},
            {"name": "Domains Tracked", "value": str(domains_tracked), "inline": True},
            {"name": "Top 5", "value": top_list or "None", "inline": False},
        ],
    }

    # Add alerts for pending-delete domains
    dropping = [d for d in top if d.get("status") == "pending_delete"]
    if dropping:
        drop_list = "\n".join(f"**{d.get('name')}** (score: {d.get('score', 0)})" for d in dropping[:5])
        embed["fields"].append({
            "name": "Dropping Soon",
            "value": drop_list,
            "inline": False,
        })
        embed["color"] = 0xFF4444  # Red for urgent

    payload = {"embeds": [embed]}

    try:
        resp = requests.post(webhook_url, json=payload, timeout=10)
        if resp.status_code in (200, 204):
            print("[discord] Scan summary sent")
        else:
            print(f"[discord] Summary failed: HTTP {resp.status_code}")
    except requests.RequestException as e:
        print(f"[discord] Error: {e}")
