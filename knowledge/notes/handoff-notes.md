# Handoff Notes Bridge the Gap Between Sessions

**Type:** Note
**Connected to:** [[processing-workflow]], [[agent-cognition]], [[session-continuity]]

---

## Claim

When work spans multiple agent sessions, explicit handoff notes — structured records of what was done, what's pending, and what context the next session needs — are the primary mechanism for maintaining continuity.

## Structure of a Good Handoff Note

```
## What Was Done
- Specific, verifiable accomplishments

## What's Pending
- Explicit next steps with enough context to act on them

## Key Decisions Made
- Decisions and their rationale (the next session needs to know WHY, not just WHAT)

## Context to Load
- Specific notes, files, or resources the next session should read first

## Blockers
- Anything that prevents progress and needs external resolution
```

## Why Explicit Handoffs Matter

Without handoff notes, the next session must:
1. Re-discover what was already done (wasted work)
2. Re-make decisions that were already made (inconsistency risk)
3. Guess what the previous session intended (misalignment risk)

With handoff notes, the next session can bootstrap directly into productive work by loading the handoff note as part of [[session-bootstrap]].

## Handoff vs. Commit Messages

Commit messages record *what changed*. Handoff notes record *what to do next*. They're complementary:
- Commits face backward (what happened)
- Handoffs face forward (what should happen)

## In Multi-Agent Systems

When different agents handle different phases (e.g., one agent drafts notes, another reviews and links them), handoff notes serve as the coordination protocol. Each agent reads the previous agent's handoff and writes its own.

---

**See also:** [[session-bootstrap]], [[inter-agent-handoff]], [[context-loss-mitigation]]
