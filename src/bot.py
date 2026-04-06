"""Main bot runner — orchestrates scraping, enrichment, scoring, and watchlist updates."""

import os
import sys
import time
import random
import json as _json
import signal
import threading
import traceback
import schedule
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timezone
from rich.console import Console
from rich.table import Table

from src.config import Config
from src.scraper import ExpiredDomainsScraper, RawDomain
from src.enrichment import DomainEnricher, EnrichedDomain
from src.scorer import rank_domains
from src.watchlist import Watchlist
from src.discord_webhook import send_discord_alert, send_scan_summary

console = Console()
running = True
last_scan_status = {
    "domains_found": 0,
    "domains_tracked": 0,
    "last_scan": "never",
    "errors": [],
    "logged_in": False,
    "scan_duration_sec": 0,
}


def signal_handler(sig, frame):
    global running
    console.print("\n[yellow]Shutting down...[/yellow]")
    running = False


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def run_scan():
    """Execute one full scan cycle: scrape -> enrich -> score -> watchlist -> discord."""
    global last_scan_status
    start_time = time.time()

    console.rule("[bold blue]Starting Domain Scan")
    last_scan_status["errors"] = []

    try:
        # 1. Scrape
        console.print("Scraping expired domains...")
        scraper = ExpiredDomainsScraper()
        raw_domains = scraper.fetch_all(pages_per_category=5)

        last_scan_status["domains_found"] = len(raw_domains)
        last_scan_status["last_scan"] = datetime.now(timezone.utc).isoformat()
        last_scan_status["logged_in"] = scraper.logged_in

        if not raw_domains:
            msg = "No domains found. Check ED credentials."
            console.print(f"[yellow]{msg}[/yellow]")
            last_scan_status["errors"].append(msg)
            # Still notify Discord so you know something's wrong
            send_scan_summary(0, 0, [])
            return

        console.print(f"[green]Found {len(raw_domains)} raw domains[/green]")
        # Log samples with metrics
        has_metrics = [d for d in raw_domains if d.backlinks > 0 or d.trust_flow > 0]
        console.print(f"  {len(has_metrics)} have scraper-level SEO metrics")
        for d in raw_domains[:3]:
            console.print(f"  {d.name} BL={d.backlinks} DP={d.domain_pop} TF={d.trust_flow}")

        # 2. Enrich
        console.print("Enriching with PageRank + RDAP...")
        enricher = DomainEnricher()
        enriched = enricher.enrich_batch(raw_domains)
        console.print(f"[green]Enriched {len(enriched)} domains[/green]")

        # 3. Score and rank
        ranked = rank_domains(enriched)
        console.print(f"[green]{len(ranked)} domains scored > 0[/green]")

        # 4. Update watchlist
        watchlist = Watchlist()
        new_count = 0
        for domain in ranked:
            if watchlist.add(domain):
                new_count += 1

        last_scan_status["domains_tracked"] = len(watchlist)
        elapsed = round(time.time() - start_time, 1)
        last_scan_status["scan_duration_sec"] = elapsed
        console.print(f"[green]Watchlist: {new_count} new, {len(watchlist)} total ({elapsed}s)[/green]")

        # 5. Display top results
        top = watchlist.get_top(25)
        if top:
            table = Table(title="Top 25 Domains")
            table.add_column("#", width=3)
            table.add_column("Domain", min_width=20)
            table.add_column("Score", justify="right")
            table.add_column("BL", justify="right")
            table.add_column("TF", justify="right")
            table.add_column("PR", justify="right")
            table.add_column("Age", justify="right")
            table.add_column("Status")
            for i, d in enumerate(top, 1):
                table.add_row(
                    str(i), d.get("name", ""),
                    f"{d.get('score', 0):.1f}",
                    str(d.get("backlinks", 0)),
                    str(d.get("trust_flow", 0)),
                    f"{d.get('page_rank', 0):.1f}",
                    f"{d.get('domain_age_years', 0):.0f}",
                    d.get("status", ""),
                )
            console.print(table)

        # 6. Discord notifications
        console.print("Sending Discord notification...")
        send_scan_summary(len(raw_domains), len(watchlist), top)

        # Alert on high-value or dropping domains
        alerts = [d for d in top if d.get("score", 0) >= 15 or d.get("status") == "pending_delete"]
        if alerts:
            send_discord_alert(alerts, title="High-Value Domain Alert")

    except Exception as e:
        msg = f"Scan error: {traceback.format_exc()}"
        console.print(f"[red]{msg}[/red]")
        last_scan_status["errors"].append(str(e))


# === HTTP API ===

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        path = parsed.path.rstrip("/")

        handlers = {
            "/api/top": lambda: _top_payload(int(params.get("n", ["25"])[0])),
            "/api/alerts": _alerts_payload,
            "/api/watchlist": lambda: _watchlist_payload(params),
            "/webhook/test": _test_payload,
        }
        data = handlers.get(path, _status_payload)()
        self._send(200, data)

    def do_POST(self):
        self.do_GET()

    def _send(self, code, data):
        body = _json.dumps(data, indent=2, default=str).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass


def _status_payload():
    try:
        watchlist = Watchlist()
        tracked = len(watchlist)
    except Exception:
        tracked = last_scan_status.get("domains_tracked", 0)
    return {
        "status": "running",
        "logged_in": last_scan_status.get("logged_in", False),
        "domains_found": last_scan_status.get("domains_found", 0),
        "domains_tracked": tracked,
        "last_scan": last_scan_status.get("last_scan", "never"),
        "scan_duration_sec": last_scan_status.get("scan_duration_sec", 0),
        "next_scan_hours": Config.CHECK_INTERVAL_HOURS,
        "errors": last_scan_status.get("errors", []),
    }


def _top_payload(n=25):
    watchlist = Watchlist()
    top = watchlist.get_top(n)
    return {
        "count": len(top),
        "domains": [
            {
                "name": d.get("name"), "score": d.get("score", 0),
                "status": d.get("status", ""),
                "domain_age_years": d.get("domain_age_years", 0),
                "backlinks": d.get("backlinks", 0),
                "referring_domains": d.get("domain_pop", 0),
                "trust_flow": d.get("trust_flow", 0),
                "page_rank": d.get("page_rank", 0),
            }
            for d in top
        ],
    }


def _alerts_payload():
    watchlist = Watchlist()
    alerts = []
    for d in watchlist.get_top(100):
        reasons = []
        if d.get("status") == "pending_delete":
            reasons.append("DROPPING_SOON")
        if d.get("score", 0) >= 20:
            reasons.append("HIGH_VALUE")
        if d.get("trust_flow", 0) >= 15:
            reasons.append("HIGH_TRUST_FLOW")
        if d.get("page_rank", 0) >= 3:
            reasons.append("HIGH_PAGERANK")
        if reasons:
            alerts.append({"name": d.get("name"), "score": d.get("score", 0),
                           "alerts": reasons, "status": d.get("status", "")})
    return {"alert_count": len(alerts), "alerts": alerts}


def _watchlist_payload(params):
    watchlist = Watchlist()
    domains = list(watchlist.entries.values())
    min_score = float(params.get("min_score", ["0"])[0])
    tld = params.get("tld", [None])[0]
    status = params.get("status", [None])[0]
    if min_score > 0:
        domains = [d for d in domains if d.get("score", 0) >= min_score]
    if tld:
        domains = [d for d in domains if d.get("tld") == tld]
    if status:
        domains = [d for d in domains if d.get("status") == status]
    domains.sort(key=lambda d: d.get("score", 0), reverse=True)
    return {"total": len(domains), "domains": domains}


def _test_payload():
    return {
        "event": "test",
        "message": "Webhook OK",
        "endpoints": {
            "/": "Status", "/api/top?n=10": "Top N",
            "/api/alerts": "Alerts", "/api/watchlist?min_score=10&tld=com": "Filtered watchlist",
        },
    }


# === Entry points ===

def start_health_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    console.print(f"[dim]HTTP server on port {port}[/dim]")


def run_scheduled():
    start_health_server()
    interval = Config.CHECK_INTERVAL_HOURS
    console.print(f"[bold]Domain Watchlist Bot[/bold] — every {interval}h")

    # First scan in background
    threading.Thread(target=run_scan, daemon=True).start()

    schedule.every(interval).hours.do(
        lambda: threading.Thread(target=run_scan, daemon=True).start()
    )

    while running:
        schedule.run_pending()
        time.sleep(30)


def main():
    args = sys.argv[1:]
    cmd = args[0] if args else "scan"

    if cmd == "scan":
        run_scan()
    elif cmd == "watch":
        run_scheduled()
    elif cmd == "list":
        watchlist = Watchlist()
        top = watchlist.get_top(50)
        for i, d in enumerate(top, 1):
            print(f"{i:3}. {d.get('name', ''):30} score={d.get('score',0):6.1f} BL={d.get('backlinks',0)} TF={d.get('trust_flow',0)}")
    elif cmd == "check" and len(args) > 1:
        from src.purchaser import DomainPurchaser
        p = DomainPurchaser()
        for r in p.check_availability(args[1]):
            print(f"  {r['registrar']}: {'AVAILABLE' if r.get('available') else 'TAKEN'} {r.get('price', '')}")
    else:
        print("Usage: python -m src [scan|watch|list|check <domain>]")


if __name__ == "__main__":
    main()
