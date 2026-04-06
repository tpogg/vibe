"""Enrich domains with SEO metrics from RDAP, Open PageRank, and WhoisXML."""

import time
import requests
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from src.config import Config
from src.scraper import RawDomain


@dataclass
class EnrichedDomain:
    name: str
    tld: str = ""
    status: str = "expired"

    # From scraper
    backlinks: int = 0
    domain_pop: int = 0
    archive_count: int = 0
    trust_flow: int = 0
    citation_flow: int = 0

    # From RDAP / WHOIS
    creation_date: str = ""
    expiration_date: str = ""
    domain_age_years: float = 0.0
    registrar: str = ""

    # From Open PageRank
    page_rank: float = 0.0
    rank: int = 0

    # Computed
    score: float = 0.0
    source: str = "expireddomains"

    def to_dict(self) -> dict:
        return asdict(self)


# RDAP servers by TLD
RDAP_SERVERS = {
    "com": "https://rdap.verisign.com/com/v1",
    "net": "https://rdap.verisign.com/net/v1",
    "org": "https://rdap.org/org/v1",
    "io": "https://rdap.nic.io/v1",
    "dev": "https://rdap.nic.google/v1",
    "co": "https://rdap.nic.co/v1",
    "app": "https://rdap.nic.google/v1",
}


class DomainEnricher:
    """Enriches raw domain data with WHOIS age and SEO rank metrics."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers["User-Agent"] = "DomainWatchlistBot/1.0"

    def enrich_batch(self, raw_domains: list[RawDomain]) -> list[EnrichedDomain]:
        enriched = []

        # 1. Batch PageRank lookup first (fast, up to 100 per call)
        domain_names = [r.name.lower() for r in raw_domains]
        pagerank_map = self._batch_pagerank(domain_names)
        print(f"[enrich] PageRank data for {len(pagerank_map)}/{len(domain_names)} domains")

        # 2. Convert and apply PageRank
        for raw in raw_domains:
            domain = EnrichedDomain(
                name=raw.name.lower(),
                tld=raw.tld,
                status=raw.status,
                backlinks=raw.backlinks,
                domain_pop=raw.domain_pop,
                archive_count=raw.archive_count,
                trust_flow=raw.trust_flow,
                citation_flow=raw.citation_flow,
                source=raw.source,
            )
            pr_data = pagerank_map.get(domain.name, {})
            domain.page_rank = pr_data.get("page_rank_decimal", 0.0)
            domain.rank = pr_data.get("rank", 0)
            enriched.append(domain)

        # 3. RDAP only for promising domains (score > 0 or has backlinks)
        #    to avoid wasting time on junk domains
        promising = [d for d in enriched if d.backlinks > 0 or d.page_rank > 0 or d.trust_flow > 0]
        print(f"[enrich] RDAP lookup for {len(promising)} promising domains")

        for domain in promising[:50]:  # Cap at 50 to keep scan time reasonable
            self._enrich_rdap(domain)

        return enriched

    def _enrich_rdap(self, domain: EnrichedDomain):
        """Fetch domain age from RDAP. Works for .com/.net and some others."""
        tld = domain.tld.lower()
        base = RDAP_SERVERS.get(tld)
        if not base:
            return

        try:
            url = f"{base}/domain/{domain.name}"
            resp = self.session.get(url, timeout=8)
            if resp.status_code != 200:
                return

            data = resp.json()
            now = datetime.now(timezone.utc)

            for event in data.get("events", []):
                action = event.get("eventAction", "")
                date_str = event.get("eventDate", "")
                if not date_str:
                    continue
                try:
                    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                except ValueError:
                    continue

                if action == "registration":
                    domain.creation_date = date_str
                    domain.domain_age_years = round((now - dt).days / 365.25, 1)
                elif action == "expiration":
                    domain.expiration_date = date_str

            # Extract registrar name
            for entity in data.get("entities", []):
                if "registrar" in entity.get("roles", []):
                    vcard = entity.get("vcardArray", [])
                    if len(vcard) > 1:
                        for item in vcard[1]:
                            if item[0] == "fn":
                                domain.registrar = str(item[3])
                                break

        except (requests.RequestException, ValueError, KeyError):
            pass
        time.sleep(0.2)

    def _batch_pagerank(self, domains: list[str]) -> dict:
        """Fetch Open PageRank for up to 100 domains per call."""
        if not Config.OPENPAGERANK_API_KEY or not domains:
            print("[enrich] No OPENPAGERANK_API_KEY configured")
            return {}

        results = {}
        for i in range(0, len(domains), 100):
            batch = domains[i:i + 100]
            try:
                resp = self.session.get(
                    "https://openpagerank.com/api/v1.0/getPageRank",
                    params=[("domains[]", d) for d in batch],
                    headers={"API-OPR": Config.OPENPAGERANK_API_KEY},
                    timeout=15,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("response", []):
                        name = item.get("domain", "").lower()
                        if name:
                            pr = item.get("page_rank_decimal")
                            rank = item.get("rank")
                            results[name] = {
                                "page_rank_decimal": float(pr) if pr else 0.0,
                                "rank": int(rank) if rank else 0,
                            }
                else:
                    print(f"[enrich] PageRank API HTTP {resp.status_code}")
                time.sleep(0.3)
            except requests.RequestException as e:
                print(f"[enrich] PageRank error: {e}")
                continue

        return results
