"""Main bot runner — orchestrates scraping, enrichment, scoring, and watchlist updates."""

import os
import sys
import time
import random
import signal
import threading
import schedule
from http.server import HTTPServer, BaseHTTPRequestHandler
from rich.console import Console
from rich.table import Table

from src.config import Config
from src.scraper import ExpiredDomainsScraper, RawDomain
from src.enrichment import DomainEnricher, EnrichedDomain
from src.scorer import rank_domains, score_domain
from src.watchlist import Watchlist
from src.purchaser import DomainPurchaser

console = Console()
running = True
last_scan_status = {"domains_found": 0, "domains_tracked": 0, "last_scan": "never", "errors": []}


def signal_handler(sig, frame):
    global running
    console.print("\n[yellow]Shutting down...[/yellow]")
    running = False


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def print_table(domains: list[dict], title: str = "Domain Watchlist"):
    table = Table(title=title, show_lines=False)
    table.add_column("Rank", style="dim", width=4)
    table.add_column("Domain", style="bold cyan", min_width=25)
    table.add_column("Score", style="bold green", justify="right")
    table.add_column("Age (yr)", justify="right")
    table.add_column("Backlinks", justify="right")
    table.add_column("Ref Domains", justify="right")
    table.add_column("TF", justify="right")
    table.add_column("PageRank", justify="right")
    table.add_column("Status", style="yellow")

    for i, d in enumerate(domains, 1):
        table.add_row(
            str(i),
            d.get("name", ""),
            f"{d.get('score', 0):.1f}",
            f"{d.get('domain_age_years', 0):.1f}",
            str(d.get("backlinks", 0)),
            str(d.get("domain_pop", 0)),
            str(d.get("trust_flow", 0)),
            f"{d.get('page_rank', 0):.1f}",
            d.get("status", ""),
        )
    console.print(table)


def run_scan():
    """Execute one full scan cycle: scrape -> enrich -> score -> watchlist."""
    global last_scan_status
    from datetime import datetime, timezone

    console.rule("[bold blue]Starting Domain Scan")
    last_scan_status["errors"] = []

    try:
        # 1. Scrape expired domains
        console.print("[dim]Scraping expired domains...[/dim]")
        scraper = ExpiredDomainsScraper()
        raw_domains = scraper.fetch_all(pages_per_category=5)

        last_scan_status["domains_found"] = len(raw_domains)
        last_scan_status["last_scan"] = datetime.now(timezone.utc).isoformat()

        if not raw_domains:
            msg = "No domains found. Check ED_USERNAME/ED_PASSWORD env vars."
            console.print(f"[yellow]{msg}[/yellow]")
            last_scan_status["errors"].append(msg)
            return

        console.print(f"[green]Found {len(raw_domains)} raw domains[/green]")
        for d in raw_domains[:5]:
            console.print(f"  [dim]sample: {d.name} BL={d.backlinks} DP={d.domain_pop} TF={d.trust_flow}[/dim]")

        # 2. Enrich with SEO data
        console.print("[dim]Enriching with RDAP + PageRank data...[/dim]")
        enricher = DomainEnricher()
        enriched = enricher.enrich_batch(raw_domains)
        console.print(f"[green]Enriched {len(enriched)} domains[/green]")

        # 3. Score and rank
        ranked = rank_domains(enriched)
        console.print(f"[green]{len(ranked)} domains passed minimum thresholds[/green]")

        if not ranked:
            msg = f"0/{len(enriched)} domains passed filters."
            console.print(f"[yellow]{msg}[/yellow]")
            last_scan_status["errors"].append(msg)
            return

        # 4. Update watchlist
        watchlist = Watchlist()
        new_count = 0
        for domain in ranked:
            if watchlist.add(domain):
                new_count += 1

        last_scan_status["domains_tracked"] = len(watchlist)
        console.print(f"[green]Watchlist updated: {new_count} new, {len(watchlist)} total[/green]")

        # 5. Display top results
        top = watchlist.get_top(25)
        print_table(top, title="Top 25 Domains by Score")

        # 6. Flag domains expiring soon
        expiring = [d for d in top if d.get("status") == "pending_delete"]
        if expiring:
            console.print(f"\n[bold red]{len(expiring)} high-value domains pending deletion![/bold red]")
            for d in expiring[:5]:
                console.print(f"  -> {d['name']} (score: {d['score']})")

    except Exception as e:
        msg = f"Scan error: {e}"
        console.print(f"[red]{msg}[/red]")
        last_scan_status["errors"].append(msg)


def run_once():
    """Run a single scan and exit."""
    run_scan()


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        import json as _json
        from urllib.parse import urlparse, parse_qs

        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        path = parsed.path.rstrip("/")

        if path == "/webhook/test":
            # Returns a sample payload for testing webhook integration
            self._send_json(200, _sample_webhook_payload())
        elif path == "/api/watchlist":
            # Full watchlist with all domain details
            self._send_json(200, _full_watchlist_payload(params))
        elif path == "/api/top":
            n = int(params.get("n", ["25"])[0])
            self._send_json(200, _top_domains_payload(n))
        elif path == "/api/alerts":
            # High-value domains needing action (pending delete, high score)
            self._send_json(200, _alerts_payload())
        else:
            # Default status
            self._send_json(200, _status_payload())

    def do_POST(self):
        # Accept POST for webhook-style integrations
        self.do_GET()

    def _send_json(self, code, data):
        import json as _json
        body = _json.dumps(data, indent=2).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass


def _status_payload() -> dict:
    watchlist = Watchlist()
    return {
        "status": "running",
        "domains_found": last_scan_status.get("domains_found", 0),
        "domains_tracked": len(watchlist),
        "last_scan": last_scan_status.get("last_scan", "never"),
        "next_scan_hours": Config.CHECK_INTERVAL_HOURS,
        "errors": last_scan_status.get("errors", []),
    }


def _top_domains_payload(n: int = 25) -> dict:
    watchlist = Watchlist()
    top = watchlist.get_top(n)
    return {
        "count": len(top),
        "domains": [
            {
                "name": d.get("name"),
                "score": d.get("score", 0),
                "status": d.get("status", ""),
                "domain_age_years": d.get("domain_age_years", 0),
                "backlinks": d.get("backlinks", 0),
                "referring_domains": d.get("domain_pop", 0),
                "trust_flow": d.get("trust_flow", 0),
                "citation_flow": d.get("citation_flow", 0),
                "page_rank": d.get("page_rank", 0),
                "expiration_date": d.get("expiration_date", ""),
                "purchased": d.get("purchased", False),
            }
            for d in top
        ],
    }


def _alerts_payload() -> dict:
    """High-priority domains: high score or pending deletion."""
    watchlist = Watchlist()
    all_domains = watchlist.get_top(100)

    alerts = []
    for d in all_domains:
        reasons = []
        if d.get("status") == "pending_delete":
            reasons.append("DROPPING_SOON")
        if d.get("score", 0) >= 30:
            reasons.append("HIGH_VALUE")
        if d.get("trust_flow", 0) >= 20:
            reasons.append("HIGH_TRUST_FLOW")
        if reasons:
            alerts.append({
                "name": d.get("name"),
                "score": d.get("score", 0),
                "alerts": reasons,
                "status": d.get("status", ""),
                "backlinks": d.get("backlinks", 0),
                "trust_flow": d.get("trust_flow", 0),
                "expiration_date": d.get("expiration_date", ""),
            })

    return {"alert_count": len(alerts), "alerts": alerts}


def _full_watchlist_payload(params: dict) -> dict:
    watchlist = Watchlist()
    min_score = float(params.get("min_score", ["0"])[0])
    status_filter = params.get("status", [None])[0]
    tld_filter = params.get("tld", [None])[0]

    domains = list(watchlist.entries.values())

    if min_score > 0:
        domains = [d for d in domains if d.get("score", 0) >= min_score]
    if status_filter:
        domains = [d for d in domains if d.get("status") == status_filter]
    if tld_filter:
        domains = [d for d in domains if d.get("tld") == tld_filter]

    domains.sort(key=lambda d: d.get("score", 0), reverse=True)

    return {
        "total": len(domains),
        "filters": {"min_score": min_score, "status": status_filter, "tld": tld_filter},
        "domains": domains,
    }


def _sample_webhook_payload() -> dict:
    return {
        "event": "domain_alert",
        "domains": [
            {"name": "example.com", "score": 72.5, "status": "pending_delete",
             "alerts": ["DROPPING_SOON", "HIGH_VALUE"]},
        ],
        "message": "Webhook test successful. Wire this URL to your Discord/Slack webhook.",
        "endpoints": {
            "/": "Bot status overview",
            "/api/top?n=10": "Top N domains by score",
            "/api/alerts": "High-priority domains needing action",
            "/api/watchlist": "Full watchlist (filterable: ?min_score=20&status=expired&tld=com)",
            "/webhook/test": "This test payload",
        },
    }


def start_health_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    console.print(f"[dim]Health server listening on port {port}[/dim]")


def run_scheduled():
    """Run on a schedule (configured via CHECK_INTERVAL_HOURS)."""
    # Start HTTP server FIRST so Render sees a healthy service
    start_health_server()

    interval = Config.CHECK_INTERVAL_HOURS
    console.print(f"[bold]Domain Watchlist Bot[/bold] — scanning every {interval} hours")
    console.print(f"Watchlist: {Config.WATCHLIST_PATH}")
    console.print(f"Thresholds: age≥{Config.MIN_DOMAIN_AGE_YEARS}yr, BL≥{Config.MIN_BACKLINKS}, DA≥{Config.MIN_DOMAIN_AUTHORITY}")
    console.print()

    # Run first scan in a background thread so health server stays responsive
    scan_thread = threading.Thread(target=run_scan, daemon=True)
    scan_thread.start()

    # Schedule recurring runs
    schedule.every(interval).hours.do(lambda: threading.Thread(target=run_scan, daemon=True).start())

    while running:
        schedule.run_pending()
        time.sleep(30)

    console.print("[dim]Bot stopped.[/dim]")


def show_watchlist():
    """Display the current watchlist."""
    watchlist = Watchlist()
    if not watchlist.entries:
        console.print("[yellow]Watchlist is empty. Run a scan first.[/yellow]")
        return
    top = watchlist.get_top(50)
    print_table(top, title=f"Watchlist ({len(watchlist)} domains)")


def check_domain(domain_name: str):
    """Check a specific domain's availability across registrars."""
    purchaser = DomainPurchaser()
    console.print(f"[dim]Checking availability for {domain_name}...[/dim]")
    results = purchaser.check_availability(domain_name)
    if not results:
        console.print("[yellow]No registrar APIs configured. Set API keys in .env[/yellow]")
        return
    for r in results:
        status = "[green]AVAILABLE[/green]" if r.get("available") else "[red]TAKEN[/red]"
        price = f"${r.get('price', '?')}" if r.get("available") else ""
        console.print(f"  {r['registrar']:>10}: {status} {price}")


def _generate_demo_domains() -> list[RawDomain]:
    """Generate realistic sample domains for demo/testing when live scraping is unavailable."""
    samples = [
        ("techvault.com",       "com", 8500,  320, 145, 32, 38, "expired"),
        ("greenleafio.com",     "com", 3200,  185, 89,  28, 34, "pending_delete"),
        ("dataforge.net",       "net", 12400, 520, 210, 41, 45, "expired"),
        ("pixelcraft.org",      "org", 1800,  95,  62,  19, 25, "expiring"),
        ("cloudpeak.io",        "io",  6700,  410, 175, 35, 40, "expired"),
        ("marketpulse.com",     "com", 22000, 890, 340, 48, 52, "pending_delete"),
        ("swiftlabs.dev",       "dev", 950,   68,  45,  14, 18, "expiring"),
        ("bluehorizon.net",     "net", 4100,  230, 110, 26, 31, "expired"),
        ("apexdigital.com",     "com", 15600, 640, 280, 44, 48, "expired"),
        ("neonwave.co",         "co",  2100,  125, 70,  21, 27, "pending_delete"),
        ("frostbyte.io",        "io",  7800,  380, 160, 33, 39, "expired"),
        ("solarprime.com",      "com", 31000, 1200,450, 55, 58, "expired"),
        ("urbanstack.net",      "net", 1400,  82,  55,  16, 22, "expiring"),
        ("quantumleap.org",     "org", 9200,  450, 195, 37, 42, "pending_delete"),
        ("brightpath.com",      "com", 5300,  290, 130, 30, 36, "expired"),
        ("ironclad.dev",        "dev", 680,   48,  30,  11, 15, "expiring"),
        ("vividmedia.com",      "com", 18500, 750, 310, 46, 50, "expired"),
        ("stormcloud.io",       "io",  3800,  200, 98,  24, 30, "pending_delete"),
        ("trailblazer.net",     "net", 11000, 480, 220, 39, 44, "expired"),
        ("echovault.com",       "com", 2600,  150, 78,  22, 28, "expiring"),
    ]
    domains = []
    for name, tld, bl, dp, arc, tf, cf, status in samples:
        domains.append(RawDomain(
            name=name, tld=tld, backlinks=bl, domain_pop=dp,
            archive_count=arc, trust_flow=tf, citation_flow=cf,
            source="demo", status=status,
        ))
    return domains


def run_demo():
    """Run the full pipeline with sample data (no network required)."""
    console.rule("[bold blue]Starting Demo Scan (sample data)")

    raw_domains = _generate_demo_domains()
    console.print(f"[green]Loaded {len(raw_domains)} sample domains[/green]")

    # Build enriched domains with simulated age and pagerank
    enriched = []
    for raw in raw_domains:
        d = EnrichedDomain(
            name=raw.name, tld=raw.tld, status=raw.status,
            backlinks=raw.backlinks, domain_pop=raw.domain_pop,
            archive_count=raw.archive_count,
            trust_flow=raw.trust_flow, citation_flow=raw.citation_flow,
            source=raw.source,
            domain_age_years=round(random.uniform(2.0, 18.0), 1),
            page_rank=round(random.uniform(1.0, 7.5), 1),
        )
        enriched.append(d)

    console.print(f"[green]Enriched {len(enriched)} domains (simulated age + PageRank)[/green]")

    ranked = rank_domains(enriched)
    console.print(f"[green]{len(ranked)} domains passed minimum thresholds[/green]")

    if not ranked:
        console.print("[yellow]No domains met the minimum criteria.[/yellow]")
        return

    watchlist = Watchlist()
    new_count = 0
    for domain in ranked:
        if watchlist.add(domain):
            new_count += 1

    console.print(f"[green]Watchlist updated: {new_count} new, {len(watchlist)} total[/green]")

    top = watchlist.get_top(25)
    print_table(top, title="Top Domains by Score (Demo)")

    expiring = [d for d in top if d.get("status") == "pending_delete"]
    if expiring:
        console.print(f"\n[bold red]{len(expiring)} high-value domains pending deletion — consider backorder![/bold red]")
        for d in expiring[:5]:
            console.print(f"  -> {d['name']} (score: {d['score']}, status: {d['status']})")


def main():
    args = sys.argv[1:]

    if not args or args[0] == "scan":
        run_once()
    elif args[0] == "demo":
        run_demo()
    elif args[0] == "watch":
        run_scheduled()
    elif args[0] == "list":
        show_watchlist()
    elif args[0] == "check" and len(args) > 1:
        check_domain(args[1])
    else:
        console.print("[bold]Domain Watchlist Bot[/bold]")
        console.print()
        console.print("Usage:")
        console.print("  python -m src scan              Run one scan cycle (live)")
        console.print("  python -m src demo              Run with sample data (no API keys needed)")
        console.print("  python -m src watch             Run continuously on schedule")
        console.print("  python -m src list              Show current watchlist")
        console.print("  python -m src check <domain>    Check domain availability")


if __name__ == "__main__":
    main()
