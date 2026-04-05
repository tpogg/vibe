# Graph Structure

**Type:** Map of Content
**Domain:** How wiki links, topology, and linking patterns create traversable knowledge graphs

---

## Overview

Knowledge graphs aren't databases with a schema — they're emergent structures that arise from local linking decisions. Every `[[wiki link]]` is a micro-architectural choice. In aggregate, these choices produce topologies that either enable or frustrate agent navigation.

This MOC covers the structural substrate: what the graph looks like, what properties matter, and how linking patterns shape traversal.

## Core Notes

### Topology
- [[small-world-topology]] — why knowledge graphs naturally form small-world networks, and why this is the ideal structure for agent traversal
- [[spreading-activation]] — how agents traverse graphs by following links from activated nodes, mimicking associative memory
- [[cluster-coefficient]] — measuring local density; high clustering within topics enables depth-first exploration

### Linking Patterns
- [[bidirectional-links]] — wiki links are directional in syntax but bidirectional in intent; backlinks complete the picture
- [[link-density-sweet-spot]] — too few links create silos, too many create noise; the optimal range for atomic notes
- [[hub-nodes-and-bridges]] — MOCs as hubs, synthesis notes as bridges; the backbone of global navigability

### Structural Health
- [[dead-end-detection]] — notes with no outgoing links trap agent traversal; monitoring and remediation strategies
- [[orphan-notes]] — notes with no incoming links are invisible to traversal; integration strategies
- [[graph-fragmentation]] — when clusters lose inter-connections; diagnosis and repair

## Key Arguments

The central argument from [[coherent-architecture-emerges]]: wiki links + spreading activation + small-world topology = a system where agents can start anywhere and efficiently reach relevant content.

Graph structure isn't something you design top-down. You cultivate it bottom-up through consistent linking practices, then monitor and adjust when structural health metrics degrade.

## Connections

- **Agent cognition** — [[agent-cognition]] describes how agents *use* the structure this MOC describes
- **Discovery** — [[discovery-retrieval]] covers how agents *find* entry points into the graph
- **Quality** — [[note-quality]] ensures individual nodes are worth traversing to
- **Evolution** — [[system-evolution]] covers how structure changes over time

---

**See also:** [[coherent-architecture-emerges]], [[agent-cognition]], [[index]]
