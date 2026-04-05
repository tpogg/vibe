# Exploration: Scaling Limits of Human Curation

**Type:** Exploration (Open Question)
**Status:** Needs Investigation
**Connected to:** [[human-agent-collaboration]], [[system-evolution]], [[the-system-is-the-argument]]

---

## The Question

At what system size does human curation become the bottleneck? When does a knowledge graph outgrow a single curator's ability to maintain coherence, detect contradictions, and guide synthesis?

## Estimated Thresholds

Based on patterns from wikis, Zettelkasten practitioners, and documentation systems:

**~50-100 notes:** Comfortable for a single curator. The full graph fits in mental model. Links can be maintained manually. Contradictions are noticed organically.

**~200-500 notes:** Strain appears. The curator can no longer hold the full graph in mind. Some clusters become neglected. Stale notes accumulate. Synthesis opportunities are missed because the curator doesn't see all the relevant notes together.

**~1000+ notes:** Human curation alone is insufficient. Agents must assist with:
- Link auditing (finding broken links, orphans, dead ends)
- Staleness detection (flagging notes that reference outdated content)
- Synthesis suggestions (identifying dense clusters that lack synthesis notes)
- Contradiction detection (finding notes that make conflicting claims)

**~5000+ notes:** The system likely needs multiple curators or significant agent automation for maintenance. Graph health metrics become essential operational tools, not optional diagnostics.

## The Transition Problem

The shift from human-curated to human-agent-curated is itself a challenge:
- When do you introduce agent curation? Too early and the overhead isn't justified. Too late and quality has already degraded.
- How do you maintain editorial voice and consistency when agents contribute to curation?
- How do you audit agent curation decisions?

## Possible Approaches

1. **Gradual delegation** — start with agents handling mechanical tasks (link auditing) and progressively delegate judgment tasks (synthesis suggestions)
2. **Quality metrics** — establish measurable graph health indicators so degradation is detected early
3. **Curator specialization** — assign different human curators to different MOC areas, with agents handling cross-cutting concerns

## Connection to the System

This exploration is particularly relevant because this knowledge system will face these scaling questions as it grows. The current system (~20-30 notes) is comfortably in the human-curated range, but the methodology it describes is designed for larger scales.

If [[the-system-is-the-argument]], then the system must eventually demonstrate its own scaling strategies — or acknowledge their limits.

---

**See also:** [[human-agent-collaboration]], [[system-evolution]], [[staleness-detection]]
