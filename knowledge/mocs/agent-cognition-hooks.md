# Agent Cognition: Hooks

**Type:** Map of Content (Sub-MOC of [[agent-cognition]])
**Domain:** Hook enforcement, composition, and the cognitive science of automated quality

---

## Overview

Hooks are automated checks that run during agent operations — before commits, after edits, on session start. They serve as external cognitive guardrails: enforcing quality standards that agents might otherwise skip under context pressure.

Hooks are to agents what habits are to humans: automated behaviors that free up cognitive resources for harder problems.

## Core Notes

### Hook Fundamentals
- [[hook-as-cognitive-offloading]] — hooks externalize quality checks so agents don't spend context window budget on remembering to lint, test, or validate
- [[hook-composition]] — combining multiple hooks into pipelines; ordering matters because earlier hooks can gate later ones
- [[hook-failure-modes]] — when hooks block good work: false positives, over-strict validation, and the cost of interruption

### Enforcement Patterns
- [[pre-commit-hooks]] — the most common enforcement point; catches issues before they enter the graph
- [[session-start-hooks]] — orient the agent at session start by loading relevant context, checking environment state
- [[post-edit-hooks]] — validate changes immediately after they're made; fast feedback loops

### Cognitive Science Parallels
- [[habit-formation-in-agents]] — hooks as externalized habits; agents don't "learn" habits, they're given them
- [[interruption-cost]] — every hook failure is a context switch; minimizing false positives matters for agent productivity
- [[quality-floor-vs-ceiling]] — hooks enforce a floor (minimum quality); they can't enforce a ceiling (creative excellence)

## Key Arguments

Hooks solve a fundamental problem in agent cognition: agents are stateless across sessions, so they can't build habits through repetition. Hooks provide the equivalent — consistent quality behaviors that persist regardless of which agent or session is operating.

But hooks have costs. Each hook invocation is an interruption. Over-hooking creates "hook fatigue" — the agent equivalent of alert blindness. The sweet spot is a small number of high-value hooks that catch real problems without blocking good work.

## Connections

- **Parent MOC** — [[agent-cognition]] provides broader context on agent thinking
- **Platforms** — [[agent-cognition-platforms]] covers how different platforms support hooks
- **Quality** — [[note-quality]] defines what hooks should check for
- **Workflow** — [[processing-workflow]] covers how hooks fit into larger work pipelines

---

**See also:** [[agent-cognition]], [[agent-cognition-platforms]], [[processing-workflow]]
