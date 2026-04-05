# Agent Cognition

**Type:** Map of Content
**Domain:** How agents think through external structures: traversal, sessions, attention limits

---

## Overview

Agents don't have persistent memory — they have context windows. Every session starts blank. Knowledge systems serve as external cognitive architecture: the structure agents load into working memory to think with.

This MOC covers how agents interact with knowledge graphs: what they can hold in context, how they traverse, how sessions shape understanding, and what the limits are.

## Core Notes

### Traversal Patterns
- [[spreading-activation]] — the core traversal mechanism: load a note, its links become candidates, follow the most relevant
- [[depth-vs-breadth-traversal]] — when agents should go deep into a cluster vs. scan across MOCs
- [[context-window-as-working-memory]] — the fundamental constraint: agents can only "think about" what fits in context

### Session Architecture
- [[session-bootstrap]] — how an agent orients at the start of a session: loading index, MOCs, or task-relevant notes
- [[session-continuity]] — strategies for maintaining coherence across sessions without persistent memory
- [[handoff-notes]] — notes written specifically to transfer context between sessions or agents

### Attention and Limits
- [[attention-budget]] — agents have finite context; every note loaded is a budget allocation decision
- [[cognitive-load-in-agents]] — when too many notes degrade reasoning quality; the paradox of more information
- [[progressive-context-loading]] — start with MOCs, drill into details only as needed; respects attention budget

## Sub-MOCs

- [[agent-cognition-hooks]] — how automated hooks enforce quality during agent operations
- [[agent-cognition-platforms]] — platform capabilities, abstraction layers, and context file architecture

## Key Arguments

The central tension: agents need broad knowledge to make good decisions, but have finite context to hold it in. Knowledge system architecture resolves this tension through:

1. **Hierarchical summarization** — MOCs summarize their children, so loading a MOC gives broad orientation without consuming budget on details
2. **Link-guided drilling** — agents follow links to load details only when needed, rather than loading everything up front
3. **Session handoffs** — when a single session can't complete the work, handoff notes preserve enough context for the next session

## Connections

- **Graph structure** — [[graph-structure]] describes what agents navigate *through*
- **Discovery** — [[discovery-retrieval]] describes how agents *find* what to load
- **Workflow** — [[processing-workflow]] describes how work flows *across* agent sessions
- **Collaboration** — [[human-agent-collaboration]] describes the human side of the equation

---

**See also:** [[coherent-architecture-emerges]], [[graph-structure]], [[index]]
