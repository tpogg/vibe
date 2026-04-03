"""Scrape expired and expiring domains from ExpiredDomains.net."""

import time
import random
import requests
from bs4 import BeautifulSoup
from dataclasses import dataclass, field
from src.config import Config


@dataclass
class RawDomain:
    name: str
    tld: str = ""
    backlinks: int = 0
    domain_pop: int = 0  # referring domains
    archive_count: int = 0  # Wayback Machine snapshots
    trust_flow: int = 0
    citation_flow: int = 0
    source: str = "expireddomains"
    status: str = "expired"  # expired | pending_delete | expiring


BASE_URL = "https://www.expireddomains.net"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


class ExpiredDomainsScraper:
    """Scrapes ExpiredDomains.net for recently expired and dropping domains."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.logged_in = False

    def login(self) -> bool:
        if not Config.ED_USERNAME or not Config.ED_PASSWORD:
            print("[scraper] No ExpiredDomains.net credentials configured, using unauthenticated mode")
            return False

        login_url = f"{BASE_URL}/login/"
        try:
            page = self.session.get(login_url, timeout=15)
            soup = BeautifulSoup(page.text, "lxml")
            # Extract hidden form fields
            form = soup.find("form", {"id": "loginform"}) or soup.find("form")
            hidden = {}
            if form:
                for inp in form.find_all("input", {"type": "hidden"}):
                    hidden[inp.get("name", "")] = inp.get("value", "")

            payload = {
                **hidden,
                "login": Config.ED_USERNAME,
                "password": Config.ED_PASSWORD,
            }
            resp = self.session.post(login_url, data=payload, timeout=15)
            self.logged_in = resp.status_code == 200 and "logout" in resp.text.lower()
            if self.logged_in:
                print("[scraper] Logged in to ExpiredDomains.net")
            else:
                print("[scraper] Login may have failed — continuing anyway")
            return self.logged_in
        except requests.RequestException as e:
            print(f"[scraper] Login error: {e}")
            return False

    def _parse_listing_page(self, html: str) -> list[RawDomain]:
        soup = BeautifulSoup(html, "lxml")
        domains = []
        table = soup.find("table", class_="base1")
        if not table:
            return domains

        rows = table.find("tbody")
        if not rows:
            return domains

        for row in rows.find_all("tr"):
            cols = row.find_all("td")
            if len(cols) < 5:
                continue
            try:
                name_tag = cols[0].find("a", class_="namemark") or cols[0].find("a")
                if not name_tag:
                    continue
                domain_name = name_tag.text.strip()

                domain = RawDomain(name=domain_name)

                # Parse available numeric columns — column positions vary
                # but typically: BL, DP, ABY (archive.org birth year),
                # ACR (archive count), TF, CF
                for i, col in enumerate(cols[1:], start=1):
                    text = col.text.strip().replace(",", "")
                    if not text or text == "-":
                        continue
                    # Map by column header class or position
                    col_class = col.get("class", [])
                    col_class_str = " ".join(col_class)

                    if "field_bl" in col_class_str:
                        domain.backlinks = int(text) if text.isdigit() else 0
                    elif "field_domainpop" in col_class_str or "field_dp" in col_class_str:
                        domain.domain_pop = int(text) if text.isdigit() else 0
                    elif "field_abirth" in col_class_str:
                        pass  # archive birth year
                    elif "field_acount" in col_class_str or "field_acr" in col_class_str:
                        domain.archive_count = int(text) if text.isdigit() else 0
                    elif "field_tf" in col_class_str:
                        domain.trust_flow = int(text) if text.isdigit() else 0
                    elif "field_cf" in col_class_str:
                        domain.citation_flow = int(text) if text.isdigit() else 0

                # Extract TLD from domain name
                parts = domain_name.rsplit(".", 1)
                if len(parts) == 2:
                    domain.tld = parts[1]

                domains.append(domain)
            except (ValueError, IndexError):
                continue

        return domains

    def fetch_deleted_domains(self, pages: int = 3) -> list[RawDomain]:
        """Fetch recently deleted (available for registration) domains."""
        return self._fetch_listing("/deleted-domains/", pages, status="expired")

    def fetch_pending_delete(self, pages: int = 3) -> list[RawDomain]:
        """Fetch domains in pending-delete status (dropping soon)."""
        # Try multiple known URL patterns
        for path in ["/pending-delete-domains/", "/pendingdelete-domains/", "/deleted-domains/?fstatus=pendingdelete"]:
            results = self._fetch_listing(path, pages, status="pending_delete")
            if results:
                return results
        return []

    def fetch_expiring(self, pages: int = 3) -> list[RawDomain]:
        """Fetch domains that are expiring soon."""
        for path in ["/expired-domains/", "/expiring-domains/", "/deleted-domains/?fstatus=expired"]:
            results = self._fetch_listing(path, pages, status="expiring")
            if results:
                return results
        return []

    def _fetch_listing(self, path: str, pages: int, status: str) -> list[RawDomain]:
        all_domains = []
        for page_num in range(pages):
            url = f"{BASE_URL}{path}"
            params = {"start": page_num * 25}  # 25 results per page
            try:
                resp = self.session.get(url, params=params, timeout=20)
                if resp.status_code != 200:
                    print(f"[scraper] HTTP {resp.status_code} on {url}")
                    break
                batch = self._parse_listing_page(resp.text)
                for d in batch:
                    d.status = status
                all_domains.extend(batch)
                print(f"[scraper] Page {page_num + 1}: found {len(batch)} domains from {path}")
                # Polite delay between requests
                time.sleep(random.uniform(2.0, 5.0))
            except requests.RequestException as e:
                print(f"[scraper] Request error: {e}")
                break

        return all_domains

    def fetch_all(self, pages_per_category: int = 5) -> list[RawDomain]:
        """Fetch from all categories and deduplicate."""
        if not self.logged_in:
            self.login()

        all_domains = []
        all_domains.extend(self.fetch_deleted_domains(pages_per_category))
        all_domains.extend(self.fetch_pending_delete(pages_per_category))
        all_domains.extend(self.fetch_expiring(pages_per_category))

        # Deduplicate by domain name
        seen = set()
        unique = []
        for d in all_domains:
            if d.name not in seen:
                seen.add(d.name)
                unique.append(d)

        print(f"[scraper] Total unique domains found: {len(unique)}")
        return unique
