# Spreading Activation Enables Efficient Graph Traversal

**Type:** Note
**Connected to:** [[graph-structure]], [[agent-cognition]], [[coherent-architecture-emerges]]

---

## Claim

Spreading activation — the process of following links from a currently-active node to discover related nodes — is the primary mechanism by which agents navigate knowledge graphs efficiently.

## How It Works

1. An agent loads a note into context (the note is "activated")
2. The note's wiki links become visible candidates for next activation
3. The agent evaluates candidates against its current goal and selects the most relevant
4. The selected note is loaded, its links become new candidates
5. Repeat until the goal is satisfied or attention budget is exhausted

This mirrors spreading activation in neural networks and cognitive science: activation flows from a source node through connections, with strength decaying over distance.

## Why It's Effective

- **No global index required** — the agent doesn't need to know the full graph; local links provide sufficient navigation
- **Relevance-guided** — at each step, the agent chooses the most relevant link, naturally steering toward useful content
- **Emergent coverage** — even without a plan, spreading activation through a well-linked graph tends to cover relevant territory
- **Self-limiting** — attention budget naturally bounds the spread; agents stop when they have enough context

## Structural Requirements

Spreading activation only works well when the graph has:
- **Sufficient link density** — sparse graphs have dead ends that terminate activation (see [[dead-end-detection]])
- **Small-world topology** — ensures any relevant note is reachable in a few hops (see [[small-world-topology]])
- **Meaningful links** — links should connect genuinely related concepts, not just any concepts that co-occur

## Limitations

- Agents can get trapped in local clusters, missing relevant distant notes
- Activation is biased toward high-degree nodes (hubs get visited more often)
- No guarantee of optimal paths — agents may take circuitous routes

These limitations are mitigated by MOCs (which provide direct long-range links) and synthesis notes (which bridge clusters).

---

**See also:** [[small-world-topology]], [[depth-vs-breadth-traversal]], [[context-window-as-working-memory]]
