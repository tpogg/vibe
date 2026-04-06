"""Score domains based on SEO metrics to identify high-value targets."""

import math
from src.config import Config
from src.enrichment import EnrichedDomain


def score_domain(domain: EnrichedDomain) -> float:
    """Calculate a 0-100 quality score for a domain.

    Scoring breakdown (100 points max):
      - Domain age:      0-20 pts (scaled over 15 years)
      - Backlinks:       0-20 pts (log scale)
      - Referring domains: 0-15 pts (log scale)
      - Trust Flow:      0-15 pts (scaled over 40)
      - Citation Flow:   0-5 pts  (scaled over 50)
      - PageRank:        0-15 pts (scaled over 8)
      - Archive count:   0-10 pts (log scale)
    """
    pts = 0.0

    # Domain age: older = more authority
    if domain.domain_age_years > 0:
        pts += min(domain.domain_age_years / 15.0, 1.0) * 20

    # Backlinks: log scale, 10 BL ≈ 5pts, 1K ≈ 15pts, 10K ≈ 20pts
    if domain.backlinks > 0:
        pts += min(math.log10(domain.backlinks + 1) / 4.0, 1.0) * 20

    # Referring domains: diversity signal
    if domain.domain_pop > 0:
        pts += min(math.log10(domain.domain_pop + 1) / 3.5, 1.0) * 15

    # Trust Flow (Majestic): quality signal, 40+ is elite
    if domain.trust_flow > 0:
        pts += min(domain.trust_flow / 40.0, 1.0) * 15

    # Citation Flow: volume signal
    if domain.citation_flow > 0:
        pts += min(domain.citation_flow / 50.0, 1.0) * 5

    # Open PageRank: 0-10 scale, 8+ is exceptional
    if domain.page_rank > 0:
        pts += min(domain.page_rank / 8.0, 1.0) * 15

    # Archive.org count: legitimacy / history signal
    if domain.archive_count > 0:
        pts += min(math.log10(domain.archive_count + 1) / 3.0, 1.0) * 10

    return round(pts, 2)


def rank_domains(domains: list[EnrichedDomain]) -> list[EnrichedDomain]:
    """Score and rank all domains. Only filter out true zero-value junk."""
    for d in domains:
        d.score = score_domain(d)

    # Only skip domains with literally nothing — no metrics at all
    qualified = [d for d in domains if d.score > 0]

    qualified.sort(key=lambda d: d.score, reverse=True)
    return qualified
