# Evergreen Notes Are Written to Last

**Type:** Note
**Connected to:** [[note-quality]], [[progressive-refinement]]

---

## Claim

Notes should be written in a way that remains valid and useful over time. Avoiding temporal references, version-specific details, and ephemeral context makes notes durable components of a growing knowledge system.

## Principles

1. **Concept over instance** — write about the pattern, not the specific occurrence. "Small-world topology enables efficient traversal" lasts; "GPT-4's context window is 128K" doesn't.

2. **Claim over description** — "Spreading activation enables efficient graph traversal" is evergreen because the relationship holds regardless of implementation details. "How LangChain implements graph search" is coupled to a specific tool.

3. **Stable references** — link to other notes in the knowledge system (stable) rather than external URLs (fragile). When external references are necessary, describe the key insight inline so the note works even if the link breaks.

4. **Revision over replacement** — when a note needs updating, refine it rather than archiving and rewriting. The note's identity (its title, path, and incoming links) is valuable and should be preserved.

## What Evergreen Does NOT Mean

- It doesn't mean never updating — notes should evolve through [[progressive-refinement]]
- It doesn't mean avoiding specifics — concrete examples are valuable, just don't make them the load-bearing argument
- It doesn't mean timeless perfection — a good-enough evergreen note is better than a perfect ephemeral one

## Why This Matters for Agents

Agents loading stale notes waste context budget on outdated information and may make incorrect decisions based on it. Evergreen notes reduce the maintenance burden of [[staleness-detection]] and increase the expected value of every note load.

---

**See also:** [[note-quality]], [[information-density]], [[staleness-detection]]
