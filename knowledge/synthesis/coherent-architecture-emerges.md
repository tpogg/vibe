# Coherent Architecture Emerges from Wiki Links, Spreading Activation, and Small-World Topology

**Type:** Synthesis
**Status:** Developing
**Connected to:** [[the-system-is-the-argument]], [[graph-structure]], [[agent-cognition]], [[discovery-retrieval]]

---

## The Foundational Triangle

Three concepts form the structural backbone of agent knowledge systems:

1. **Wiki links** — the atomic unit of connection. A `[[link]]` declares "this idea relates to that idea." No taxonomy required, no hierarchy imposed. Links are cheap, local, and bidirectional in intent.

2. **Spreading activation** — the traversal pattern. When an agent loads a note, its links become candidates for next-load. High-link notes activate more of the graph. This mirrors how associative memory works in neural systems.

3. **Small-world topology** — the emergent structure. Wiki links naturally produce small-world graphs: most notes cluster locally (within a topic), but a few long-range links connect distant clusters. This gives agents the property they need most — any concept is reachable in a few hops.

## What Structure Looks Like

A well-formed knowledge graph has observable properties:

- **Cluster density** — notes within a MOC like [[graph-structure]] are densely interlinked
- **Bridge nodes** — synthesis notes and cross-domain claims ([[forced-engagement-produces-weak-connections]]) link across clusters
- **Hub-and-spoke MOCs** — each MOC serves as a high-degree hub, reachable from many notes, providing orientation
- **Short path lengths** — from any note, most other notes are 2-3 hops away

## Why It Works

The small-world property solves the fundamental tension in knowledge organization: **local coherence vs. global navigability**.

Hierarchical systems (folders, taxonomies) optimize for local coherence — everything about "graph theory" lives in one place. But they sacrifice navigability: finding connections between "graph theory" and "cognitive science" requires climbing up and back down the tree.

Flat systems (tags, full-text search) optimize for navigability — anything can connect to anything. But they sacrifice coherence: there's no sense of which connections matter.

Wiki-linked knowledge graphs get both. Local clusters provide coherence. Long-range links and synthesis notes provide navigability. The [[agent-cognition]] implications are significant: agents can start anywhere and reach relevant context efficiently.

## How Agents Navigate It

An agent entering this knowledge system follows a predictable pattern:

1. **Entry** — load the index or a MOC relevant to the current task
2. **Orientation** — scan links to understand what's available
3. **Targeted descent** — follow links toward specific sub-topics
4. **Lateral discovery** — encounter cross-links to unexpected but relevant notes
5. **Synthesis** — combine information from multiple traversed notes

This pattern maps directly to [[spreading-activation]]: the agent's attention "spreads" from an entry point through the link structure, activating relevant nodes.

## When to Reassess

The architecture needs revision when:

- **Path lengths grow** — if reaching relevant notes takes 5+ hops, the graph needs more bridge nodes or synthesis notes
- **Clusters isolate** — if MOC areas stop linking to each other, the system is fragmenting into silos
- **Hub overload** — if a single MOC has 50+ direct children, it needs decomposition (see [[agent-cognition]] splitting into [[agent-cognition-hooks]] and [[agent-cognition-platforms]])
- **Dead-end notes** — notes with zero outgoing links are sinks that trap traversal

See [[system-evolution]] for strategies on maintaining coherence as the graph grows.

---

**See also:** [[the-system-is-the-argument]], [[spreading-activation]], [[small-world-topology]], [[graph-structure]]
