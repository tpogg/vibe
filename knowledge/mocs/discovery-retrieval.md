# Discovery and Retrieval

**Type:** Map of Content
**Domain:** How descriptions, progressive disclosure, and search enable finding and loading content

---

## Overview

A knowledge graph is only useful if agents can find what they need. Discovery is the process of locating relevant notes; retrieval is the process of loading them into context. Together, they determine whether the knowledge system accelerates or frustrates agent work.

## Core Notes

### Discovery Mechanisms
- [[entry-point-design]] — how index files, MOCs, and context files serve as starting points for graph traversal
- [[progressive-disclosure]] — reveal structure gradually: index -> MOC -> note -> detail; don't overwhelm with everything at once
- [[search-vs-traversal]] — two modes of finding: keyword search (when you know what you want) vs. link traversal (when you're exploring)

### Retrieval Patterns
- [[note-loading-strategies]] — full load vs. summary load vs. link-only load; trading completeness for context budget
- [[relevance-ranking]] — when search returns multiple results, how to prioritize: recency, link density, explicit relevance tags
- [[lazy-loading]] — don't load a note until the agent actually needs its content; links serve as promises of future content

### Description Quality
- [[note-descriptions]] — every note needs a one-line description that enables relevance judgment without full loading
- [[moc-as-annotated-bibliography]] — MOCs don't just list links; they annotate each link with enough context to decide whether to follow it
- [[title-as-claim]] — note titles should be complete claims, not topics ("spreading activation enables efficient traversal" not "spreading activation")

## Key Arguments

The discovery problem is the knowledge system's bottleneck. A perfectly structured graph with perfect notes is useless if agents can't find the right note at the right time.

Progressive disclosure is the key design pattern: structure the system so agents can make informed navigation decisions at every level without loading the entire graph. The index tells you which MOC to visit. The MOC tells you which note to read. The note tells you which links to follow.

This mirrors how [[agent-cognition]] works: agents have limited context, so every piece of information loaded should help the agent decide what to load next.

## Connections

- **Graph structure** — [[graph-structure]] provides the topology that discovery navigates
- **Agent cognition** — [[agent-cognition]] constrains how much can be loaded (the demand side)
- **Note quality** — [[note-quality]] ensures that what's discovered is worth loading
- **Platforms** — [[agent-cognition-platforms]] determines what discovery mechanisms are available

---

**See also:** [[agent-cognition]], [[graph-structure]], [[note-quality]]
