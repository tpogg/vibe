# Note Quality

**Type:** Map of Content
**Domain:** What makes a note good: density, atomicity, evergreen principles

---

## Overview

The knowledge graph is only as good as its nodes. A well-structured graph of low-quality notes is a well-organized mess. Note quality determines whether loading a note into context advances the agent's work or wastes its attention budget.

## Core Notes

### Atomicity
- [[one-idea-per-note]] — the fundamental principle: each note captures exactly one concept, claim, or argument
- [[note-scope-calibration]] — too narrow and notes become trivial; too broad and they become chapters; finding the sweet spot
- [[splitting-and-merging]] — when a note outgrows atomicity, split it; when notes are too granular, merge them

### Density
- [[information-density]] — every sentence should carry weight; remove filler, redundancy, and throat-clearing
- [[link-as-compression]] — a wiki link replaces a paragraph of explanation; the linked note carries the detail
- [[example-density]] — concrete examples per paragraph; abstract claims without examples are empty

### Evergreen Principles
- [[evergreen-notes]] — notes written to remain relevant over time; avoid temporal language, version-specific details
- [[note-as-claim]] — frame notes as arguments, not descriptions; "X enables Y" not "About X"
- [[progressive-refinement]] — notes improve over multiple passes; first draft captures the idea, later passes sharpen it

### Quality Indicators
- [[link-count-as-signal]] — notes with many incoming links are high-value (the graph votes on importance)
- [[description-quality]] — can someone decide whether to read this note from its one-line description alone?
- [[staleness-detection]] — notes that reference outdated concepts or broken links need maintenance

## Key Arguments

Quality in a knowledge system is measured by *usefulness to the traversing agent*. A note is high-quality if:

1. Loading it advances the agent's current task
2. Its links point to genuinely related notes (not tangential ones)
3. Its content is dense enough to justify the context budget it consumes
4. It remains accurate over time (evergreen)

Quality compounds through the graph: high-quality notes linked to other high-quality notes create clusters where every traversal step is valuable. Low-quality notes create "context traps" — the agent loads them, gains little, but has already spent the attention budget.

## Connections

- **Graph structure** — [[graph-structure]] determines how notes connect; quality determines whether connections are worth following
- **Discovery** — [[discovery-retrieval]] depends on accurate descriptions (a quality metric)
- **Workflow** — [[processing-workflow]] includes quality gates at each pipeline stage
- **Agent cognition** — [[agent-cognition]] makes quality critical: limited context means every loaded note must count

---

**See also:** [[graph-structure]], [[discovery-retrieval]], [[agent-cognition]]
