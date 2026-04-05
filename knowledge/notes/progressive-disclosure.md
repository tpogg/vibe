# Progressive Disclosure Respects Attention Budgets

**Type:** Note
**Connected to:** [[discovery-retrieval]], [[agent-cognition]], [[context-window-as-working-memory]]

---

## Claim

Knowledge systems should reveal information in layers — index, then MOC, then note, then detail — so agents can make informed navigation decisions at each level without committing their full attention budget upfront.

## The Pattern

**Level 0 — Index:** Lists all MOCs with one-line descriptions. An agent reads this to orient: "Which topic area is relevant to my task?"

**Level 1 — MOC:** Lists all notes in a topic with annotated links. An agent reads this to plan: "Which specific notes do I need?"

**Level 2 — Note:** Contains a single atomic concept with links to related notes. An agent reads this to learn: "What does this concept mean and how does it connect?"

**Level 3 — Detail:** Following links within a note leads to supporting evidence, examples, and related concepts. An agent does this to deepen: "I need more on this specific sub-topic."

## Why It Works

Each level filters the graph dramatically:
- Level 0: ~7-10 MOC links (the whole system's scope)
- Level 1: ~10-20 note links (one topic's scope)
- Level 2: ~3-8 links (one concept's connections)
- Level 3: varies (targeted follow-up)

An agent that needs one specific concept traverses: index (50 tokens) -> MOC (200 tokens) -> note (500 tokens) = 750 tokens to reach targeted content. Without progressive disclosure, the agent might need to load thousands of tokens to find the same information.

## Anti-Patterns

- **Flat dump:** Presenting all notes as a single list forces agents to scan everything
- **Deep nesting:** Requiring 5+ levels to reach content wastes traversal budget on navigation
- **Missing descriptions:** Links without annotations force agents to load notes speculatively

## Connection to Agent Cognition

Progressive disclosure is the architectural response to [[context-window-as-working-memory]]. Since context is limited, give agents the minimum information needed to make each navigation decision. Let them drill deeper only when they choose to.

---

**See also:** [[entry-point-design]], [[note-loading-strategies]], [[attention-budget]]
