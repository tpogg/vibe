# Agent Cognition: Platforms

**Type:** Map of Content (Sub-MOC of [[agent-cognition]])
**Domain:** Platform capability tiers, abstraction layers, and context file architecture

---

## Overview

Not all agent platforms are equal. Some offer tool use, web access, and code execution. Others are limited to text completion. The knowledge system must work across this spectrum — degrading gracefully on limited platforms while exploiting capabilities on advanced ones.

## Core Notes

### Platform Capabilities
- [[platform-capability-tiers]] — a taxonomy: Tier 1 (text only), Tier 2 (text + tools), Tier 3 (text + tools + persistent state), Tier 4 (full autonomous operation)
- [[capability-detection]] — how a knowledge system can adapt to the platform it's running on
- [[graceful-degradation]] — when tools aren't available, wiki links still work as text references; the system never fully breaks

### Abstraction Layers
- [[context-file-architecture]] — CLAUDE.md, .cursorrules, and similar files as the interface between knowledge systems and agent platforms
- [[knowledge-api-patterns]] — how agents request, load, and process knowledge through tool calls vs. inline context
- [[platform-agnostic-notes]] — writing notes that work regardless of platform tier; plain markdown as the universal format

### Context File Architecture
- [[context-file-layering]] — project-level, directory-level, and task-level context files; how they compose
- [[context-file-as-session-bootstrap]] — context files as the first thing an agent reads; they shape the entire session
- [[context-file-maintenance]] — keeping context files current as the project evolves; stale context is worse than no context

## Key Arguments

The knowledge system's power comes from being platform-agnostic at its core (markdown + wiki links) while being platform-aware at its edges (context files, hook configurations, tool integrations).

This means:
- A Tier 1 agent can still read notes and follow links manually
- A Tier 3 agent can use tools to search, traverse, and synthesize automatically
- The same knowledge graph serves both — only the traversal mechanism changes

## Connections

- **Parent MOC** — [[agent-cognition]] provides broader context on agent thinking
- **Hooks** — [[agent-cognition-hooks]] covers automated behaviors that vary by platform
- **Discovery** — [[discovery-retrieval]] covers how search capabilities (platform-dependent) affect knowledge access
- **Collaboration** — [[human-agent-collaboration]] covers how humans configure platforms for agents

---

**See also:** [[agent-cognition]], [[agent-cognition-hooks]], [[discovery-retrieval]]
