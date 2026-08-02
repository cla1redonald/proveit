## 0. Intake (runs once, before Brain Dump)

Phase 0 captures two things that make every subsequent phase sharper: **context type** (is this a new idea or an iteration on something existing?) and **prior context** (URLs, files, prior research the PM wants you to read before kickoff).

Target: ~3 minutes. Three questions. Don't expand — this is intake, not discovery.

### Step 1: Context type

> "One question before we dig in: is this a new business / product idea, or an iteration on something existing — a feature for a product you already have, or a new thing under an existing brand?"

**If new:** set `contextType: new` and continue to Step 2.

**If existing:**
- Set `contextType: existing`
- Ask: "What's the parent product or brand URL? I'll read it so I have the existing context."
- Fetch via `firecrawl_scrape` (preferred) or `WebFetch`
- Summarise the parent in 2-3 bullets: what it does, who it's for, current positioning
- Capture in `discovery.md` `## Inherited assets` section

This branching has downstream effects:
- BrandIt (Phase 7) is **skipped automatically** when `contextType: existing` (the brand exists). Optional "extend the brand" hook is offered but defaults to skip.
- Defensibility swarm agent (Phase 5) shifts framing: "what existing moats does the parent inherit?" instead of "what moat could this build?".
- Discovery (Phase 2) adds cannibalisation, internal-politics, and why-now-not-3-months-ago questions.
- Gamma deck (Phase 9) uses inherited brand assets, not placeholders.

### Step 2: Prior context

> "Anything I should read before we start? URLs, files, prior research, competitor sites, an old PRD, customer interview notes? Paste the lot — I'll read each one and summarise. Or say 'just go' if there's nothing."

Accept any combination of:
- HTTP(S) URLs → `firecrawl_scrape` or `WebFetch`
- File paths (relative or absolute) → `Read`
- Pasted text content → treat as inline source (note "pasted content" in references)

For each source:
1. Fetch / read it
2. Summarise in 2-3 bullets: what it is, what's most relevant for this validation
3. Append to `discovery.md` `## Prior context` section as: `- [URL or file path] — [bullets]`

If the user says "just go" or similar: skip, continue to Step 3 (or to Phase 1 if `contextType: new`).

Do NOT auto-fetch any URL the PM didn't explicitly hand over. The intake is consensual; ProveIt isn't a scraper.

### Step 3: Where it lives (existing only)

If `contextType: existing` and the parent URL wasn't already provided in Step 1:
> "Got it. Where does the existing thing live — production URL, app store link, internal tool URL?"

Fetch and analyse for current state. This forms the *starting position* for the iteration framing in Discovery and the swarm.

If the user can't or won't provide a URL: that's a yellow flag — note it in `discovery.md` and proceed, but the Defensibility / inheritance framing will be weaker without the parent context.

### `discovery.md` opens with these three new sections

```markdown
# ProveIt: [Idea Name]
Generated: [date]
Last updated: [date]

## Context type
[New idea | Iteration on existing — name + URL]

## Prior context (read at intake)
- [URL / file] — [2-3 bullet summary]
- [URL / file] — [...]
(or "None — clean start" if user said just go)

## Inherited assets (existing only)
- Brand: [URL or "none provided"]
- Existing product: [URL or "none"]
- Parent context summary:
  - [bullet 1]
  - [bullet 2]
  - [bullet 3]

## Confidence Score
Desirability: X/10 | Viability: X/10 | Feasibility: X/10
[... rest of discovery.md as before ...]
```

These three sections are the prior-context payload that gets passed to all swarm agents, the cross-model review, the pre-mortem, and Wave 3 — alongside the rest of `discovery.md`.

### What you do NOT do in Phase 0

- Do not start Discovery questions (that's Phase 2)
- Do not score confidence (no evidence yet)
- Do not run research subagents (that's Phase 3)
- Do not exceed 5 minutes — if you're at 5 minutes and still in intake, move on. The user will paste more context as it comes up.

---
