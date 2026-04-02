#!/usr/bin/env python3
"""
Scrape 10 images of Jennifer Aniston from the web.
Uses Wikimedia Commons API to find freely-licensed images.

Usage:
    python3 scrape_aniston_images.py
"""

import json
import os
import urllib.request
import urllib.parse
import time

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images", "jennifer_aniston")
TARGET_COUNT = 10
USER_AGENT = "VibeImageScraper/1.0 (https://github.com/tpogg/vibe)"


def wikimedia_api(params):
    """Make a request to the Wikimedia Commons API."""
    params["format"] = "json"
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def get_image_files():
    """Get image file names from the Jennifer Aniston category on Wikimedia Commons."""
    # Search for images in the Jennifer Aniston category
    data = wikimedia_api({
        "action": "query",
        "list": "categorymembers",
        "cmtitle": "Category:Jennifer Aniston",
        "cmtype": "file",
        "cmlimit": "50",
    })
    files = [m["title"] for m in data.get("query", {}).get("categorymembers", [])]

    # Also search for images by name
    search_data = wikimedia_api({
        "action": "query",
        "list": "search",
        "srsearch": "Jennifer Aniston",
        "srnamespace": "6",  # File namespace
        "srlimit": "50",
    })
    for result in search_data.get("query", {}).get("search", []):
        title = result["title"]
        if title not in files:
            files.append(title)

    # Filter to only image files
    image_extensions = (".jpg", ".jpeg", ".png", ".webp")
    return [f for f in files if f.lower().endswith(image_extensions)]


def get_image_urls(titles):
    """Get direct download URLs for a list of image titles."""
    urls = []
    # Process in batches of 10
    for i in range(0, len(titles), 10):
        batch = titles[i:i + 10]
        data = wikimedia_api({
            "action": "query",
            "titles": "|".join(batch),
            "prop": "imageinfo",
            "iiprop": "url|size|mime",
            "iiurlwidth": "1200",
        })
        for page in data.get("query", {}).get("pages", {}).values():
            info = page.get("imageinfo", [{}])[0]
            if "url" in info and info.get("mime", "").startswith("image/"):
                urls.append({
                    "title": page["title"],
                    "url": info.get("thumburl", info["url"]),
                    "original_url": info["url"],
                    "size": info.get("size", 0),
                })
        time.sleep(0.5)  # Be polite to the API
    return urls


def download_image(url, filepath):
    """Download an image from a URL to a file path."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        with open(filepath, "wb") as f:
            f.write(resp.read())


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Searching for Jennifer Aniston images on Wikimedia Commons...")
    image_files = get_image_files()
    print(f"Found {len(image_files)} image files")

    if not image_files:
        print("No images found. Exiting.")
        return

    print("Fetching download URLs...")
    image_urls = get_image_urls(image_files[:30])  # Get URLs for top 30 candidates
    print(f"Got {len(image_urls)} downloadable images")

    # Sort by size (prefer larger/higher quality images) and take top 10
    image_urls.sort(key=lambda x: x["size"], reverse=True)
    selected = image_urls[:TARGET_COUNT]

    print(f"\nDownloading {len(selected)} images to {OUTPUT_DIR}/\n")
    for i, img in enumerate(selected, 1):
        # Clean filename from title
        filename = img["title"].replace("File:", "").replace(" ", "_")
        filepath = os.path.join(OUTPUT_DIR, filename)
        print(f"  [{i}/{len(selected)}] {filename}...")
        try:
            download_image(img["url"], filepath)
            print(f"           Saved ({img['size']:,} bytes)")
        except Exception as e:
            print(f"           Failed: {e}")
        time.sleep(0.5)

    print(f"\nDone! Images saved to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
