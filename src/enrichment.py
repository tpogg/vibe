"""Enrich domains with SEO metrics from RDAP, Open PageRank, and WhoisXML."""

import time
import json
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


class DomainEnricher:
    """Enriches raw domain data with WHOIS age and SEO rank metrics."""

    def __init__(self):
        self.session = requests.Session()

    def enrich(self, raw: RawDomain) -> EnrichedDomain:
        domain = EnrichedDomain(
            name=raw.name,
            tld=raw.tld,
            status=raw.status,
            backlinks=raw.backlinks,
            domain_pop=raw.domain_pop,
            archive_count=raw.archive_count,
            trust_flow=raw.trust_flow,
            citation_flow=raw.citation_flow,
            source=raw.source,
        )
        self._enrich_rdap(domain)
        return domain

    def enrich_batch(self, raw_domains: list[RawDomain]) -> list[EnrichedDomain]:
        enriched = []
        # Batch Open PageRank lookups (supports up to 100 domains per call)
        domains_list = [r.name for r in raw_domains]
        pagerank_map = self._batch_pagerank(domains_list)

        for raw in raw_domains:
            domain = self.enrich(raw)
            if raw.name in pagerank_map:
                pr = pagerank_map[raw.name]
                domain.page_rank = pr.get("page_rank_decimal", 0.0)
                domain.rank = pr.get("rank", 0)
            enriched.append(domain)

        return enriched

    def _enrich_rdap(self, domain: EnrichedDomain):
        """Fetch domain age and expiration from RDAP (free, no key needed)."""
        try:
            url = f"https://rdap.verisign.com/{domain.tld or 'com'}/v1/domain/{domain.name}"
            resp = self.session.get(url, timeout=10)
            if resp.status_code != 200:
                # Fallback: try WhoisXML if configured
                if Config.WHOISXML_API_KEY:
                    self._enrich_whoisxml(domain)
                return

            data = resp.json()
            events = data.get("events", [])
            now = datetime.now(timezone.utc)

            for event in events:
                action = event.get("eventAction", "")
                date_str = event.get("eventDate", "")
                if not date_str:
                    continue
                # Parse ISO date
                try:
                    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                except ValueError:
                    continue

                if action == "registration":
                    domain.creation_date = date_str
                    domain.domain_age_years = round((now - dt).days / 365.25, 1)
                elif action == "expiration":
                    domain.expiration_date = date_str

            # Extract registrar
            entities = data.get("entities", [])
            for entity in entities:
                roles = entity.get("roles", [])
                if "registrar" in roles:
                    vcard = entity.get("vcardArray", [])
                    if len(vcard) > 1:
                        for item in vcard[1]:
                            if item[0] == "fn":
                                domain.registrar = item[3]
                                break

        except requests.RequestException:
            pass
        time.sleep(0.3)  # Polite delay

    def _enrich_whoisxml(self, domain: EnrichedDomain):
        """Fallback WHOIS enrichment via WhoisXML API."""
        try:
            url = "https://www.whoisxmlapi.com/whoisserver/WhoisService"
            params = {
                "domainName": domain.name,
                "apiKey": Config.WHOISXML_API_KEY,
                "outputFormat": "JSON",
            }
            resp = self.session.get(url, params=params, timeout=10)
            if resp.status_code != 200:
                return
            data = resp.json()
            record = data.get("WhoisRecord", {})

            domain.creation_date = record.get("createdDate", "")
            domain.expiration_date = record.get("expiresDate", "")
            domain.registrar = record.get("registrarName", "")

            if domain.creation_date:
                try:
                    created = datetime.fromisoformat(
                        domain.creation_date.replace("Z", "+00:00")
                    )
                    now = datetime.now(timezone.utc)
                    domain.domain_age_years = round((now - created).days / 365.25, 1)
                except ValueError:
                    pass
        except requests.RequestException:
            pass

    def _batch_pagerank(self, domains: list[str]) -> dict:
        """Fetch Open PageRank scores for up to 100 domains at a time."""
        if not Config.OPENPAGERANK_API_KEY or not domains:
            return {}

        results = {}
        # API supports 100 domains per request
        for i in range(0, len(domains), 100):
            batch = domains[i : i + 100]
            try:
                url = "https://openpagerank.com/api/v1.0/getPageRank"
                params = [("domains[]", d) for d in batch]
                headers = {"API-OPR": Config.OPENPAGERANK_API_KEY}
                resp = self.session.get(url, params=params, headers=headers, timeout=15)
                if resp.status_code != 200:
                    continue
                data = resp.json()
                for item in data.get("response", []):
                    domain_name = item.get("domain", "")
                    if domain_name:
                        results[domain_name] = {
                            "page_rank_decimal": item.get("page_rank_decimal", 0.0) or 0.0,
                            "rank": item.get("rank", 0) or 0,
                        }
                time.sleep(0.5)
            except requests.RequestException:
                continue

        return results
