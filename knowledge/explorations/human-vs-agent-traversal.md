# Exploration: Human vs. Agent Traversal Patterns

**Type:** Exploration (Open Question)
**Status:** Needs Investigation
**Connected to:** [[agent-cognition]], [[graph-structure]], [[human-agent-collaboration]]

---

## The Question

Do agents need fundamentally different knowledge graph architectures than humans? Or do the same structures serve both, with only the traversal speed and mechanism differing?

## Preliminary Observations

### Where They Seem Similar
- Both benefit from small-world topology (short paths to relevant content)
- Both use progressive disclosure (overview first, details on demand)
- Both struggle with information overload (cognitive load / context limits)

### Where They Seem Different

**Traversal speed:** Agents can load and process notes much faster than humans can read them. This might mean agents benefit from *more* notes with *more* links — a density that would overwhelm human navigation.

**Backtracking cost:** For humans, returning to a previous note is cheap (scroll up, click back). For agents with limited context, loading a previously-seen note again costs the same as the first time. This suggests agents need *more direct links* and fewer paths that require backtracking.

**Serendipity:** Humans value serendipitous discovery — following an unexpected link and finding something valuable. Agents are more goal-directed; serendipity may be noise rather than signal for them.

**Spatial memory:** Humans develop spatial intuitions about where things are in a knowledge system ("I know that note is somewhere in the graph-structure section"). Agents have no such memory across sessions. This suggests agents need *stronger entry points* and *more explicit signposting*.

**Tolerance for redundancy:** Humans find redundancy annoying. Agents might benefit from controlled redundancy — key concepts summarized in multiple places so they're accessible from more entry points.

## Research Directions

1. **Empirical comparison:** Have both humans and agents navigate the same knowledge graph; measure path lengths, coverage, and success rates
2. **Architecture variants:** Build two versions of the same knowledge — one human-optimized, one agent-optimized — and compare outcomes
3. **Hybrid design:** Identify design principles that serve both well and those that require trade-offs

## Hypothesis

The same graph structure works for both, but the *interface layer* should differ. Humans need visual navigation, spatial cues, and serendipity. Agents need explicit descriptions, direct links, and session-bootstrap optimization. The underlying notes and links can be shared.

---

**See also:** [[agent-cognition]], [[graph-structure]], [[discovery-retrieval]]
