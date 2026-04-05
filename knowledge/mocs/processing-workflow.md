# Processing Workflow

**Type:** Map of Content
**Domain:** How throughput, sessions, and handoffs move work through the system

---

## Overview

Knowledge work isn't a single operation — it's a pipeline. Notes get drafted, reviewed, linked, refined, and eventually synthesized. In agent-operated systems, this pipeline spans multiple sessions, potentially multiple agents, and requires explicit coordination.

## Core Notes

### Session Management
- [[session-as-unit-of-work]] — each agent session is a bounded work unit with a start, a set of operations, and an end
- [[session-bootstrap]] — the critical first step: loading enough context to work effectively without overloading
- [[session-wrapup]] — the critical last step: recording what was done, what's unfinished, and what the next session needs

### Handoff Patterns
- [[handoff-notes]] — structured notes that transfer context between sessions: what was done, what to do next, key decisions made
- [[inter-agent-handoff]] — when different agents (or agent types) handle different phases of work
- [[context-loss-mitigation]] — strategies for minimizing information loss across session boundaries

### Throughput
- [[batch-processing]] — processing multiple notes in a single session for efficiency; risks vs. benefits
- [[pipeline-stages]] — draft -> link -> review -> refine -> synthesize; each stage has different quality criteria
- [[bottleneck-identification]] — where does the pipeline slow down? Usually at synthesis and cross-linking

### Quality Gates
- [[review-checklists]] — what to check at each pipeline stage; complements [[agent-cognition-hooks]]
- [[link-audit]] — periodic check that links resolve, descriptions match content, no orphans exist
- [[synthesis-triggers]] — when enough notes accumulate in a cluster, it's time for a synthesis note

## Key Arguments

Agent sessions are inherently bounded — by context limits, by time, by task scope. The processing workflow must accommodate this boundedness rather than fight it.

The key insight: design work units that complete within a single session whenever possible, and design handoff mechanisms for when they can't. The worst outcome is a session that does half a job with no record of what was done.

This connects to [[agent-cognition]]: respecting context limits means designing workflows that fit within them, not workflows that assume unlimited memory.

## Connections

- **Agent cognition** — [[agent-cognition]] constrains session capacity
- **Hooks** — [[agent-cognition-hooks]] automates quality gates in the pipeline
- **Evolution** — [[system-evolution]] is the long-term result of many processing cycles
- **Collaboration** — [[human-agent-collaboration]] determines who handles which pipeline stages

---

**See also:** [[agent-cognition]], [[agent-cognition-hooks]], [[system-evolution]]
