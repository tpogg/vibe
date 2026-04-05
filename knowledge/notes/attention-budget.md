# Attention Budget Forces Strategic Loading Decisions

**Type:** Note
**Connected to:** [[agent-cognition]], [[context-window-as-working-memory]], [[progressive-context-loading]]

---

## Claim

Every token of context an agent loads is a spending decision from a finite budget. Knowledge system design must make these spending decisions easy and their costs predictable.

## The Budget Model

An agent session has a fixed context window. Subtract:
- System prompt / context files (~500-2000 tokens)
- Task specification (~200-500 tokens)
- Working space for reasoning (~30-50% of window)

What remains is the **attention budget**: the tokens available for loading knowledge notes. A typical budget might be 30-50K tokens out of a 128K window.

## Spending Wisely

**High-ROI loads:**
- MOCs during orientation (cheap: ~200 tokens, high value: maps the territory)
- Targeted notes that directly answer the current question
- Synthesis notes that provide pre-integrated context

**Low-ROI loads:**
- Notes loaded "just in case" that turn out to be irrelevant
- Redundant loads (two notes that say the same thing differently)
- Overly detailed notes when only the summary was needed

## Design Implications

The knowledge system can help agents budget by:
1. **Accurate descriptions** — let agents judge relevance before committing to a full load
2. **Predictable note sizes** — atomic notes have consistent size; agents can estimate cost
3. **Summary-first structure** — lead with the claim, put details after; agents can stop reading early
4. **Link annotations in MOCs** — "this note explains X" helps agents skip irrelevant notes

## The Budget Trap

When the budget runs low, agents face a dilemma: load more context (risking overflow) or work with incomplete information (risking errors). Well-designed knowledge systems minimize this dilemma by ensuring that high-value content is loaded first through [[progressive-disclosure]].

---

**See also:** [[context-window-as-working-memory]], [[cognitive-load-in-agents]], [[progressive-disclosure]]
