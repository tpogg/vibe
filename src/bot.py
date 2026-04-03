"""Main bot runner — orchestrates scraping, enrichment, scoring, and watchlist updates."""

import sys
import time
import signal
import schedule
from rich.console import Console
from rich.table import Table

from src.config import Config
from src.scraper import ExpiredDomainsScraper
from src.enrichment import DomainEnricher
from src.scorer import rank_domains
from src.watchlist import Watchlist
from src.purchaser import DomainPurchaser

console = Console()
running = True


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
    console.rule("[bold blue]Starting Domain Scan")

    # 1. Scrape expired domains
    console.print("[dim]Scraping expired domains...[/dim]")
    scraper = ExpiredDomainsScraper()
    raw_domains = scraper.fetch_all(pages_per_category=3)

    if not raw_domains:
        console.print("[yellow]No domains found in this scan.[/yellow]")
        return

    console.print(f"[green]Found {len(raw_domains)} raw domains[/green]")

    # 2. Enrich with SEO data
    console.print("[dim]Enriching with RDAP + PageRank data...[/dim]")
    enricher = DomainEnricher()
    enriched = enricher.enrich_batch(raw_domains)
    console.print(f"[green]Enriched {len(enriched)} domains[/green]")

    # 3. Score and rank
    ranked = rank_domains(enriched)
    console.print(f"[green]{len(ranked)} domains passed minimum thresholds[/green]")

    if not ranked:
        console.print("[yellow]No domains met the minimum criteria.[/yellow]")
        return

    # 4. Update watchlist
    watchlist = Watchlist()
    new_count = 0
    for domain in ranked:
        if watchlist.add(domain):
            new_count += 1

    console.print(f"[green]Watchlist updated: {new_count} new, {len(watchlist)} total[/green]")

    # 5. Display top results
    top = watchlist.get_top(25)
    print_table(top, title="Top 25 Domains by Score")

    # 6. Flag domains expiring soon for backorder consideration
    expiring = [d for d in top if d.get("status") == "pending_delete"]
    if expiring:
        console.print(f"\n[bold red]⚠ {len(expiring)} high-value domains pending deletion — consider backorder![/bold red]")
        for d in expiring[:5]:
            console.print(f"  → {d['name']} (score: {d['score']}, expires: {d.get('expiration_date', 'unknown')})")


def run_once():
    """Run a single scan and exit."""
    run_scan()


def run_scheduled():
    """Run on a schedule (configured via CHECK_INTERVAL_HOURS)."""
    interval = Config.CHECK_INTERVAL_HOURS
    console.print(f"[bold]Domain Watchlist Bot[/bold] — scanning every {interval} hours")
    console.print(f"Watchlist: {Config.WATCHLIST_PATH}")
    console.print(f"Thresholds: age≥{Config.MIN_DOMAIN_AGE_YEARS}yr, BL≥{Config.MIN_BACKLINKS}, DA≥{Config.MIN_DOMAIN_AUTHORITY}")
    console.print()

    # Run immediately on start
    run_scan()

    # Then schedule recurring runs
    schedule.every(interval).hours.do(run_scan)

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


def main():
    args = sys.argv[1:]

    if not args or args[0] == "scan":
        run_once()
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
        console.print("  python -m src.bot scan       Run one scan cycle")
        console.print("  python -m src.bot watch      Run continuously on schedule")
        console.print("  python -m src.bot list       Show current watchlist")
        console.print("  python -m src.bot check <domain>  Check availability")


if __name__ == "__main__":
    main()
