# The Context Window Is an Agent's Working Memory

**Type:** Note
**Connected to:** [[agent-cognition]], [[attention-budget]], [[progressive-context-loading]]

---

## Claim

An agent's context window functions as its working memory: the bounded space where all active reasoning occurs. Everything the agent "knows" in a given moment is what's currently loaded in context.

## The Analogy

| Human Working Memory | Agent Context Window |
|---------------------|---------------------|
| ~7 items (Miller's law) | ~100-200K tokens |
| Decays without rehearsal | Truncated when exceeded |
| Can be chunked for efficiency | Can be compressed via summarization |
| Retrieval from long-term memory | Loading from external knowledge system |

## Implications for Knowledge Systems

**1. Loading is expensive.** Every note loaded into context consumes budget. The knowledge system must enable agents to make informed loading decisions *before* committing context to a note. This is why [[progressive-disclosure]] and [[note-descriptions]] matter.

**2. Structure must be loadable in stages.** An agent can't load the entire knowledge graph. The hierarchical structure (index -> MOC -> note -> detail) lets agents load at the right granularity. See [[progressive-context-loading]].

**3. Relevance filtering is critical.** Not everything in the knowledge graph is relevant to the current task. Agents need mechanisms to evaluate relevance before loading: descriptions, link annotations, and MOC summaries all serve this purpose.

**4. Session boundaries create amnesia.** When a session ends, context is lost. Knowledge systems must support session continuity through explicit handoff mechanisms. See [[session-continuity]] and [[handoff-notes]].

## The Fundamental Constraint

This is the single most important constraint on knowledge system design. Every other design decision — atomicity, linking patterns, MOC structure, progressive disclosure — exists to work within the context window's limits.

A knowledge system designed for unlimited context would look very different: just dump everything into a massive document. The art of knowledge system design is making bounded context feel unbounded through smart structure and navigation.

---

**See also:** [[attention-budget]], [[cognitive-load-in-agents]], [[session-bootstrap]]
