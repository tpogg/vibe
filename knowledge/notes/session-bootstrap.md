# Session Bootstrap Sets the Trajectory for All Subsequent Work

**Type:** Note
**Connected to:** [[agent-cognition]], [[processing-workflow]], [[context-file-as-session-bootstrap]]

---

## Claim

The first few hundred tokens an agent loads in a session disproportionately influence the entire session's direction and quality. Bootstrap content — what the agent reads first — is the highest-leverage design point in a knowledge system.

## Why Bootstrap Matters

Agents have no persistent memory. Every session starts from zero. The bootstrap determines:
- **What the agent thinks the task is** — framing effects are strong
- **What vocabulary the agent uses** — terms from bootstrap content propagate through the session
- **What the agent considers relevant** — notes loaded early shape which links get followed
- **Quality expectations** — the style and rigor of bootstrap content sets the bar

## Bootstrap Sequence

An effective bootstrap follows a predictable pattern:

1. **Context file** (CLAUDE.md or equivalent) — project conventions, constraints, vocabulary
2. **Task specification** — what to do, what's in scope, what quality looks like
3. **Relevant MOC** — orient within the knowledge graph's topic area
4. **Key notes** — load the 2-3 notes most relevant to the task

Total budget: 1000-2000 tokens for orientation, leaving the rest for actual work.

## Design Implications

- **Context files should be concise** — every word in CLAUDE.md is read at the start of every session; bloat here has multiplicative cost
- **MOCs should have clear annotations** — the agent reads MOCs during bootstrap to decide what to load next; vague annotations waste bootstrap time
- **Task specifications should be self-contained** — don't assume the agent remembers previous sessions; include enough context to start cold

## Common Failures

- **Over-loading at bootstrap** — cramming too much into initial context leaves little room for actual work
- **Under-loading at bootstrap** — giving too little context leads to misaligned work that needs correction
- **Stale context files** — bootstrap content that doesn't match current project state sends agents in wrong directions

---

**See also:** [[session-continuity]], [[context-file-architecture]], [[handoff-notes]]
