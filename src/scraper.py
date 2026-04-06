"""Scrape expired and expiring domains from ExpiredDomains.net."""

import time
import random
import re
import requests
from bs4 import BeautifulSoup
from dataclasses import dataclass
from src.config import Config


@dataclass
class RawDomain:
    name: str
    tld: str = ""
    backlinks: int = 0
    domain_pop: int = 0
    archive_count: int = 0
    trust_flow: int = 0
    citation_flow: int = 0
    source: str = "expireddomains"
    status: str = "expired"


BASE_URL = "https://www.expireddomains.net"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://www.expireddomains.net/",
}

# Known multi-part TLDs
MULTI_TLDS = {"co.uk", "co.in", "com.au", "com.br", "co.nz", "co.za", "org.uk", "net.au"}


def extract_tld(domain: str) -> str:
    domain = domain.lower()
    for mt in MULTI_TLDS:
        if domain.endswith(f".{mt}"):
            return mt
    parts = domain.rsplit(".", 1)
    return parts[1] if len(parts) == 2 else ""


def parse_int(text: str) -> int:
    text = text.strip().replace(",", "").replace(".", "")
    return int(text) if text.isdigit() else 0


class ExpiredDomainsScraper:
    """Scrapes ExpiredDomains.net for expired and dropping domains."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.logged_in = False

    def login(self) -> bool:
        if not Config.ED_USERNAME or not Config.ED_PASSWORD:
            print("[scraper] No ExpiredDomains.net credentials — unauthenticated mode")
            return False

        login_url = f"{BASE_URL}/login/"
        try:
            # Get login page for CSRF tokens
            page = self.session.get(login_url, timeout=15)
            soup = BeautifulSoup(page.text, "lxml")

            form = soup.find("form", {"id": "loginform"}) or soup.find("form")
            hidden = {}
            if form:
                for inp in form.find_all("input", {"type": "hidden"}):
                    name = inp.get("name", "")
                    if name:
                        hidden[name] = inp.get("value", "")

            payload = {
                **hidden,
                "login": Config.ED_USERNAME,
                "password": Config.ED_PASSWORD,
            }
            resp = self.session.post(login_url, data=payload, timeout=15, allow_redirects=True)
            self.logged_in = resp.status_code == 200 and "logout" in resp.text.lower()
            print(f"[scraper] Login {'OK' if self.logged_in else 'FAILED'}")
            return self.logged_in
        except requests.RequestException as e:
            print(f"[scraper] Login error: {e}")
            return False

    def _parse_listing_page(self, html: str) -> list[RawDomain]:
        soup = BeautifulSoup(html, "lxml")
        domains = []

        table = soup.find("table", class_="base1")
        if not table:
            # Try alternate table classes
            table = soup.find("table", class_="base2") or soup.find("table")
        if not table:
            return domains

        # Parse column headers to map positions
        header_map = {}
        thead = table.find("thead") or table.find("tr")
        if thead:
            for i, th in enumerate(thead.find_all(["th", "td"])):
                text = th.get_text(strip=True).lower()
                classes = " ".join(th.get("class", []))
                if "domain" in text or i == 0:
                    header_map["domain"] = i
                elif "bl" in text or "bl" in classes:
                    header_map["bl"] = i
                elif "dp" in text or "pop" in text or "dp" in classes:
                    header_map["dp"] = i
                elif "tf" in text or "tf" in classes:
                    header_map["tf"] = i
                elif "cf" in text or "cf" in classes:
                    header_map["cf"] = i
                elif "acr" in text or "archive" in text or "aby" in text:
                    header_map["acr"] = i

        tbody = table.find("tbody") or table
        for row in tbody.find_all("tr"):
            cols = row.find_all("td")
            if len(cols) < 2:
                continue
            try:
                # Find domain name — look for link or first cell
                name_tag = (
                    cols[0].find("a", class_="namemark")
                    or cols[0].find("a", href=re.compile(r"/domain/"))
                    or cols[0].find("a")
                )
                if not name_tag:
                    # Try plain text
                    text = cols[0].get_text(strip=True)
                    if "." in text and len(text) > 3:
                        domain_name = text.lower()
                    else:
                        continue
                else:
                    domain_name = name_tag.get_text(strip=True).lower()

                if not domain_name or "." not in domain_name:
                    continue

                domain = RawDomain(name=domain_name, tld=extract_tld(domain_name))

                # Try to parse metrics by column class first, then by header position
                for i, col in enumerate(cols):
                    col_classes = " ".join(col.get("class", []))
                    text = col.get_text(strip=True).replace(",", "")

                    # Match by CSS class (most reliable)
                    if any(c in col_classes for c in ["field_bl", "field_backlinks"]):
                        domain.backlinks = parse_int(text)
                    elif any(c in col_classes for c in ["field_dp", "field_domainpop"]):
                        domain.domain_pop = parse_int(text)
                    elif "field_tf" in col_classes:
                        domain.trust_flow = parse_int(text)
                    elif "field_cf" in col_classes:
                        domain.citation_flow = parse_int(text)
                    elif any(c in col_classes for c in ["field_acr", "field_acount"]):
                        domain.archive_count = parse_int(text)
                    # Fallback: match by header position
                    elif i == header_map.get("bl"):
                        domain.backlinks = parse_int(text)
                    elif i == header_map.get("dp"):
                        domain.domain_pop = parse_int(text)
                    elif i == header_map.get("tf"):
                        domain.trust_flow = parse_int(text)
                    elif i == header_map.get("cf"):
                        domain.citation_flow = parse_int(text)
                    elif i == header_map.get("acr"):
                        domain.archive_count = parse_int(text)

                domains.append(domain)
            except (ValueError, IndexError):
                continue

        return domains

    def _fetch_listing(self, path: str, pages: int, status: str) -> list[RawDomain]:
        all_domains = []
        for page_num in range(pages):
            url = f"{BASE_URL}{path}"
            # Handle paths that already have query params
            sep = "&" if "?" in path else "?"
            full_url = f"{url}{sep}start={page_num * 25}"
            try:
                resp = self.session.get(full_url, timeout=20)
                if resp.status_code != 200:
                    print(f"[scraper] HTTP {resp.status_code} on {path}")
                    break
                batch = self._parse_listing_page(resp.text)
                for d in batch:
                    d.status = status
                all_domains.extend(batch)
                print(f"[scraper] {path} p{page_num+1}: {len(batch)} domains")
                if len(batch) == 0:
                    break  # No more results
                time.sleep(random.uniform(2.0, 4.0))
            except requests.RequestException as e:
                print(f"[scraper] Error on {path}: {e}")
                break
        return all_domains

    def fetch_all(self, pages_per_category: int = 5) -> list[RawDomain]:
        """Fetch from all categories and deduplicate."""
        if not self.logged_in:
            self.login()

        all_domains = []

        # Deleted .com domains (highest value)
        sources = [
            ("/deleted-domains/", "expired"),
            ("/expired-domains/", "expiring"),
        ]
        # Try alternate paths for pending delete
        pending_paths = [
            "/pending-delete-domains/",
            "/pendingdelete-domains/",
        ]

        for path, status in sources:
            results = self._fetch_listing(path, pages_per_category, status)
            all_domains.extend(results)

        for path in pending_paths:
            results = self._fetch_listing(path, pages_per_category, "pending_delete")
            if results:
                all_domains.extend(results)
                break

        # Deduplicate
        seen = set()
        unique = []
        for d in all_domains:
            key = d.name.lower()
            if key not in seen:
                seen.add(key)
                unique.append(d)

        print(f"[scraper] Total unique: {len(unique)}")
        return unique
