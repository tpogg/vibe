# Human-Agent Collaboration

**Type:** Map of Content
**Domain:** The interface between human curators and agent operators

---

## Overview

Knowledge systems work best when humans and agents each do what they're good at. Humans excel at judgment, taste, and strategic direction. Agents excel at throughput, consistency, and exhaustive traversal. The collaboration interface determines how effectively these complementary strengths combine.

## Core Notes

### Role Division
- [[human-as-curator]] — humans set direction, make editorial judgments, resolve contradictions, and ensure the system serves real needs
- [[agent-as-operator]] — agents execute traversals, draft notes, check consistency, and process bulk work
- [[shared-vocabulary]] — humans and agents need common terminology for effective handoffs; the knowledge system itself provides this

### Interface Design
- [[context-files-as-interface]] — CLAUDE.md and similar files are the primary communication channel from human curator to agent operator
- [[task-specification-patterns]] — how humans describe work for agents: scope, constraints, quality criteria, done conditions
- [[feedback-loops]] — how agents report back: handoff notes, commit messages, PR descriptions, status updates

### Trust and Verification
- [[trust-calibration]] — humans should trust agents more for mechanical tasks, less for judgment calls; calibration improves with experience
- [[review-patterns]] — human review of agent work: what to check, what to trust, when to intervene
- [[escalation-protocols]] — when agents should stop and ask vs. proceed with best judgment

### Collaboration Anti-Patterns
- [[over-specification]] — describing every step removes agent autonomy and produces brittle workflows
- [[under-specification]] — giving agents vague goals without constraints produces unpredictable results
- [[human-bottleneck]] — when all decisions require human approval, agent throughput collapses

## Key Arguments

The knowledge system itself is the best collaboration medium. When a human writes a synthesis note, they're simultaneously:
1. Organizing their own thinking
2. Creating a navigational resource for agents
3. Establishing shared vocabulary and framing

When an agent drafts a note, it's simultaneously:
1. Processing information into reusable form
2. Identifying gaps and contradictions for human review
3. Building the graph structure that enables future traversal

This bidirectional value creation is why [[the-system-is-the-argument]] works: the system serves both parties because both parties contribute to it.

## Connections

- **Agent cognition** — [[agent-cognition]] describes agent capabilities and limits that shape collaboration
- **Workflow** — [[processing-workflow]] is where collaboration happens in practice
- **Platforms** — [[agent-cognition-platforms]] determines what collaboration interfaces are available
- **Scaling** — [[scaling-limits-of-curation]] explores when human curation capacity becomes the binding constraint

---

**See also:** [[agent-cognition]], [[processing-workflow]], [[scaling-limits-of-curation]]
