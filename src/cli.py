"""CLI entry point — export, categorize, and upload Discord server media."""

import argparse
import logging
import sys

from .categorizer import categorize_export, get_summary
from .cloud_storage import GoogleDriveUploader
from .config import DISCORD_TOKEN, ORGANIZED_DIR
from .exporter import ExportError, export_channels, export_guild, list_channels, list_guilds

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def cmd_servers(args):
    """List all servers you're in."""
    guilds = list_guilds()
    if not guilds:
        print("No servers found.")
        return

    print(f"\nYou are in {len(guilds)} server(s):\n")
    for g in guilds:
        print(f"  {g['id']}  {g['name']}")
    print(f"\nUse: vibe scrape <server-id>")


def cmd_channels(args):
    """List channels in a server."""
    channels = list_channels(args.server)
    if not channels:
        print("No channels found.")
        return

    print(f"\n{len(channels)} channel(s):\n")
    current_category = None
    for c in channels:
        cat = c["category"] or "(no category)"
        if cat != current_category:
            current_category = cat
            print(f"  [{cat}]")
        print(f"    {c['id']}  #{c['name']}")


def cmd_scrape(args):
    """Full pipeline: export -> categorize -> upload."""
    server_id = args.server

    # Resolve server name
    print("Fetching server info...")
    guilds = list_guilds()
    guild = next((g for g in guilds if g["id"] == server_id), None)
    if not guild:
        print(f"Server {server_id} not found. Run: vibe servers")
        sys.exit(1)

    guild_name = guild["name"]
    print(f"\n=== Scraping: {guild_name} ===\n")

    # Step 1: Export from Discord
    print("[1/3] Exporting media from Discord...")
    try:
        if args.channels:
            export_dir = export_channels(args.channels, guild_name)
        else:
            export_dir = export_guild(server_id, guild_name)
    except ExportError as exc:
        print(f"\nExport failed:\n{exc}")
        sys.exit(1)

    print(f"  Export saved to: {export_dir}")

    # Step 2: Categorize
    print("\n[2/3] Categorizing files...")
    output_dir = ORGANIZED_DIR / export_dir.name
    categorize_export(export_dir, output_dir)

    summary = get_summary(output_dir)
    total = sum(summary.values())
    print(f"  Organized {total} files:")
    for cat, count in sorted(summary.items()):
        print(f"    {cat}: {count}")

    if total == 0:
        print("\nNo media files found.")
        return

    # Step 3: Upload to Google Drive
    if args.no_upload:
        print(f"\n[3/3] Skipping upload (--no-upload)")
        print(f"  Files are at: {output_dir}")
    else:
        print("\n[3/3] Uploading to Google Drive...")
        try:
            uploader = GoogleDriveUploader()
            uploader.upload_directory(output_dir)
            stats = uploader.stats
            print(f"  Uploaded {stats['uploaded']} files, {stats['failed']} failed")
        except Exception as exc:
            logger.exception("Upload failed")
            print(f"\n  Upload failed: {exc}")
            print(f"  Files are still available locally at: {output_dir}")
            sys.exit(1)

    print(f"\n=== Done! ===")


def cmd_organize(args):
    """Categorize an already-exported directory (skip re-exporting)."""
    from pathlib import Path

    export_dir = Path(args.directory)
    if not export_dir.is_dir():
        print(f"Directory not found: {export_dir}")
        sys.exit(1)

    output_dir = ORGANIZED_DIR / export_dir.name
    if args.output:
        output_dir = Path(args.output)

    print(f"Categorizing files from: {export_dir}")
    categorize_export(export_dir, output_dir)

    summary = get_summary(output_dir)
    total = sum(summary.values())
    print(f"\nOrganized {total} files:")
    for cat, count in sorted(summary.items()):
        print(f"  {cat}: {count}")

    if not args.no_upload:
        print("\nUploading to Google Drive...")
        try:
            uploader = GoogleDriveUploader()
            uploader.upload_directory(output_dir)
            stats = uploader.stats
            print(f"Uploaded {stats['uploaded']} files, {stats['failed']} failed")
        except Exception as exc:
            print(f"Upload failed: {exc}")
            print(f"Files are at: {output_dir}")

    print(f"\nOrganized files at: {output_dir}")


def main():
    parser = argparse.ArgumentParser(
        prog="vibe",
        description="Vibe — Download, categorize, and upload Discord server media",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Debug logging")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # vibe servers
    sub = subparsers.add_parser("servers", help="List all servers you're in")
    sub.set_defaults(func=cmd_servers)

    # vibe channels <server-id>
    sub = subparsers.add_parser("channels", help="List channels in a server")
    sub.add_argument("server", help="Server ID")
    sub.set_defaults(func=cmd_channels)

    # vibe scrape <server-id> [--channels ...] [--no-upload]
    sub = subparsers.add_parser("scrape", help="Scrape a server: export, categorize, upload")
    sub.add_argument("server", help="Server ID (get from 'vibe servers')")
    sub.add_argument(
        "--channels", nargs="+", metavar="ID",
        help="Only scrape specific channel IDs (default: all channels)",
    )
    sub.add_argument(
        "--no-upload", action="store_true",
        help="Keep files locally, don't upload to Google Drive",
    )
    sub.set_defaults(func=cmd_scrape)

    # vibe organize <directory> [--output ...] [--no-upload]
    sub = subparsers.add_parser(
        "organize",
        help="Categorize and upload an already-exported directory",
    )
    sub.add_argument("directory", help="Path to exported files")
    sub.add_argument("--output", "-o", help="Custom output directory")
    sub.add_argument("--no-upload", action="store_true", help="Skip cloud upload")
    sub.set_defaults(func=cmd_organize)

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if args.command in ("servers", "channels", "scrape") and not DISCORD_TOKEN:
        print("DISCORD_TOKEN is not set. Add it to your .env file.")
        sys.exit(1)

    args.func(args)


if __name__ == "__main__":
    main()
