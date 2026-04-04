"""Score domains based on SEO metrics to identify high-value targets."""

from src.config import Config
from src.enrichment import EnrichedDomain


# Weight configuration for the scoring algorithm
WEIGHTS = {
    "domain_age": 20,       # max 20 points
    "backlinks": 20,        # max 20 points
    "domain_pop": 15,       # max 15 points (referring domains)
    "trust_flow": 15,       # max 15 points
    "citation_flow": 5,     # max 5 points
    "page_rank": 15,        # max 15 points
    "archive_count": 10,    # max 10 points (web history/legitimacy)
}
# Total possible: 100 points


def score_domain(domain: EnrichedDomain) -> float:
    """Calculate a 0-100 quality score for a domain.

    Higher scores indicate more valuable domains based on:
    - Domain age (older = more authority)
    - Backlink profile (quantity and quality)
    - Referring domains (diversity of links)
    - Majestic Trust Flow / Citation Flow
    - Open PageRank
    - Archive.org presence (legitimacy signal)
    """
    points = 0.0

    # Domain age: 0-20 points, scaled over 15 years
    if domain.domain_age_years > 0:
        age_score = min(domain.domain_age_years / 15.0, 1.0)
        points += age_score * WEIGHTS["domain_age"]

    # Backlinks: 0-20 points, log scale
    if domain.backlinks > 0:
        import math
        # 10 BL = ~5pts, 100 BL = ~10pts, 1000 BL = ~15pts, 10000+ = ~20pts
        bl_score = min(math.log10(domain.backlinks + 1) / 4.0, 1.0)
        points += bl_score * WEIGHTS["backlinks"]

    # Domain pop (referring domains): 0-15 points, log scale
    if domain.domain_pop > 0:
        import math
        dp_score = min(math.log10(domain.domain_pop + 1) / 3.5, 1.0)
        points += dp_score * WEIGHTS["domain_pop"]

    # Trust Flow: 0-15 points, scaled over 40 (max TF is ~100 but 40+ is elite)
    if domain.trust_flow > 0:
        tf_score = min(domain.trust_flow / 40.0, 1.0)
        points += tf_score * WEIGHTS["trust_flow"]

    # Citation Flow: 0-5 points, scaled over 50
    if domain.citation_flow > 0:
        cf_score = min(domain.citation_flow / 50.0, 1.0)
        points += cf_score * WEIGHTS["citation_flow"]

    # Page Rank: 0-15 points, scaled over 8 (Open PageRank 0-10 scale)
    if domain.page_rank > 0:
        pr_score = min(domain.page_rank / 8.0, 1.0)
        points += pr_score * WEIGHTS["page_rank"]

    # Archive count: 0-10 points, log scale
    if domain.archive_count > 0:
        import math
        arc_score = min(math.log10(domain.archive_count + 1) / 3.0, 1.0)
        points += arc_score * WEIGHTS["archive_count"]

    return round(points, 2)


def passes_minimum_thresholds(domain: EnrichedDomain) -> bool:
    """Check if domain meets minimum configured thresholds.

    If SEO metrics are missing (e.g. unauthenticated scrape), skip those checks
    so we still capture domains for enrichment via PageRank/RDAP.
    """
    # If we have age data and it's too young, skip
    if domain.domain_age_years > 0 and domain.domain_age_years < Config.MIN_DOMAIN_AGE_YEARS:
        return False
    # If we have backlink data and it's too low, skip
    if domain.backlinks > 0 and domain.backlinks < Config.MIN_BACKLINKS:
        return False
    # If we have PageRank data and it's too low, skip
    if domain.page_rank > 0 and domain.page_rank < (Config.MIN_DOMAIN_AUTHORITY / 10.0):
        return False
    return True


def rank_domains(domains: list[EnrichedDomain]) -> list[EnrichedDomain]:
    """Score, filter, and rank domains from best to worst."""
    for domain in domains:
        domain.score = score_domain(domain)

    # Filter by minimum thresholds
    qualified = [d for d in domains if passes_minimum_thresholds(d)]

    # Sort by score descending
    qualified.sort(key=lambda d: d.score, reverse=True)
    return qualified
