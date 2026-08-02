## Fast Mode (triggered by /proveit:proveit-fast)

Fast Mode is a preflight check, not a full validation. Target: 10-15 minutes, three critical assumptions surfaced with research evidence.

**Do not** run the full Brain Dump → Discovery → Research loop. Follow only the steps below.

### Step 1: Get the idea + lightweight intake (2 min)

Compressed Phase 0 + idea capture in one step. Ask:

> "What's the idea, in one sentence? And anything I should read first — URL, doc, prior research? (Or just say 'no'.)"

- One-line idea capture
- Optional URL/file read — **maximum 2 sources** to keep Fast Mode fast
- 1-bullet inline summary per source (no `discovery.md` written; Fast Mode is stateless by design)
- If the user mentions an existing product (e.g. "we're adding habit streaks to our journaling app at app.example.com"), fetch the URL — the 3 assumptions picked in Step 2 should incorporate cannibalisation / inheritance framing where relevant

If the PM gave an idea with the command and no prior context, that's fine — proceed straight to Step 2.

Do not ask more than 1 clarifying follow-up. Move on.

### Step 2: Identify the 3 critical assumptions (2 min)

Based on what you've heard, pick **the 3 assumptions most likely to kill this specific idea** from the catalog below. Do NOT default to Desirability / Viability / Competition for every idea — that's the lazy answer. Pick the 3 that genuinely apply to *this* idea profile.

**Assumption catalog (7 categories):**

| Category | Default for | Skip when | Anchored by |
|----------|-------------|-----------|-------------|
| **Desirability** — "Users have this pain badly enough to change behaviour" | New categories, unfamiliar problems | Pain is already well-documented (e.g. ChatGPT-shaped writing tools — pain is established) | Bob Moesta (switching forces), Sean Ellis (PMF survey), Teresa Torres (continuous discovery) |
| **Viability** — "Someone will pay for this / a business model exists" | Paid products, especially B2B | Free / portfolio / ad-supported where commercial isn't the question | Madhavan Ramanujam (WTP), Patrick Campbell (pricing data), Marc Andreessen (market quality) |
| **Competition** — "There isn't already a dominant solution doing this" | Crowded landscapes, recognisable categories | Genuinely novel space with no analogues | Dalton Caldwell (tarpit), Lenny (channel coverage) |
| **Distribution** — "There's a viable channel to reach users at acceptable cost" | Consumer-facing, content-led, viral mechanics | Captive audience already obvious (e.g. internal tool for known team) | April Dunford (positioning), Brian Balfour / Elena Verna (growth loops), Bangaly Kaba (adjacent users) |
| **Defensibility** — "There's a moat or moat-pathway, not just first-mover claim" | Anything that scales; especially AI products | Service-only with no software leverage | Hamilton Helmer (*7 Powers*), Brian Balfour (4-step defensibility), Peter Deng (data flywheels), Reid Hoffman (network effects) |
| **AI Commoditization** — "The foundation models won't ship this as a default in the next 12 months" (check `docs/frontier-snapshot.md` §3 first) | AI-powered or AI-feature-of-something-else ideas | Idea has zero AI surface | Ben Horowitz (strategic AI), Chip Huyen (ML systems), Claire Vo (AI products), Mike Krieger |
| **Regulatory** — "This is legal where you'll launch, and the compliance cost is achievable" | Health, finance, kids, data, employment, lending, education | Clearly unregulated (general consumer SaaS) | Geoffrey Moore (regulated chasms), Hilary Gridley, David Singleton |

**Selection examples:**
- *Wedding Speech Roaster* (consumer + AI + crowded, free→paid upsell): Desirability + AI Commoditization + Distribution
- *Habit tracker for HR teams* (B2B + embedded + employment data): Viability + Regulatory + Defensibility
- *AI-powered tax-prep tool*: Regulatory + AI Commoditization + Defensibility
- *Consumer journaling app*: Desirability + Distribution + Defensibility
- *Marketplace for freelance designers*: Competition + Defensibility (network effects) + Distribution

State the 3 you picked AND why, before researching:

> "Here are the 3 assumptions I'd check first for this specific idea. If any are false, the idea probably doesn't work:
> 1. **[Category]** — [Assumption phrased for this idea]. Picked because [why this idea sits in this category's default-for criteria].
> 2. **[Category]** — [Assumption]. Picked because [reason].
> 3. **[Category]** — [Assumption]. Picked because [reason].
>
> Researching now..."

The PM may push back on category choice — that's fine, swap and continue.

### Step 3: Research the 3 assumptions (5-8 min)

Spawn a single Sonnet subagent via the Task tool. Instruct it to research each assumption using WebSearch, WebFetch, and Firecrawl, and return findings in this format:

```
## Assumption 1: [Statement]
Verdict: SUPPORTED / WEAK / CONTRADICTED
Evidence:
- [Source/URL]: [What it shows]
- [Source/URL]: [What it shows]

## Assumption 2: [Statement]
Verdict: SUPPORTED / WEAK / CONTRADICTED
Evidence:
- [Source/URL]: [What it shows]

## Assumption 3: [Statement]
Verdict: SUPPORTED / WEAK / CONTRADICTED
Evidence:
- [Source/URL]: [What it shows]
```

### Step 4: Present findings and offer next steps (2 min)

Present the 3 verdicts clearly, then offer:

> **Quick verdict:** [One sentence — the biggest risk or the strongest signal]
>
> Want to:
> - **Run full ProveIt** on this idea (full research + Gamma deck)
> - **Stop here** — you've seen enough
> - **Dig into one assumption** — run the Research Swarm on [the weakest assumption]

### Fast Mode: What you do NOT do

- Do not write `discovery.md` (no persistence — this is a quick check)
- Do not ask 14 discovery questions
- Do not generate a Gamma presentation
- Do not score confidence out of 10

---
