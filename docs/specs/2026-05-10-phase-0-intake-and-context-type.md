# Spec: Phase 0 Intake, Context Type Branching, Brand/Design/Gamma Boundary

> **Historical note (2026-07-09):** The BrandIt / Brand Identity phase referenced in this document was removed from ProveIt in v3.8.0 (phases renumbered; no brand outputs) — see the `docs/design.md` changelog. Kept as a historical record; do not implement from it.


**Date:** 2026-05-10
**Status:** Implemented in v3.2
**Related plan:** [`docs/plans/2026-05-10-phase-0-intake-and-context-type.md`](../plans/2026-05-10-phase-0-intake-and-context-type.md)

This spec is the implementation contract — required structures, exact protocol, and the boundaries between adjacent tools.

## 1. Phase 0 — Intake

Runs **first**, before Phase 1 Brain Dump, in any new full-validation session. Resumed sessions check for the presence of `## Context type` in `discovery.md`; if absent, run a catch-up Phase 0 before resuming.

### Step 1: Context type

> "One question before we dig in: is this a new business / product idea, or an iteration on something existing (a feature for a product you already have, or a new product under an existing brand)?"

If the user says **new**:
- Set `contextType: new` in `discovery.md`
- Continue to Step 2

If the user says **existing**:
- Set `contextType: existing` in `discovery.md`
- Ask: "What's the parent product or brand URL? I'll read it so I have the existing context."
- Fetch via Firecrawl (preferred) or WebFetch
- Summarise the parent in 2-3 bullets (what it does, who it's for, current positioning)
- Capture in `discovery.md` `## Inherited assets` section

### Step 2: Prior context

> "Anything I should read before we start? URLs, files, prior research, competitor sites, an old PRD, customer interview notes? Paste the lot — I'll read each one and summarise. Or say 'just go' if there's nothing."

Accept any combination of:
- HTTP(S) URLs → Firecrawl or WebFetch
- File paths (relative or absolute) → Read
- Pasted text content → treat as inline source

For each source:
1. Fetch / read it
2. Summarise in 2-3 bullets: what it is, what's most relevant for this validation
3. Append to `discovery.md` `## Prior context` section as: `- [URL or file path] — [summary bullets]`

If the user says "just go" or similar: skip, continue to Step 3.

### Step 3: Where it lives (existing only)

If `contextType: existing` and the parent URL wasn't already provided in Step 1:
> "Got it. Where does the existing thing live — production URL, app store link, internal tool URL?"

Fetch and analyse for current state. This forms the *starting position* for the iteration framing.

### `discovery.md` additions from Phase 0

```markdown
## Context type
[New idea | Iteration on existing — name + URL]

## Prior context (read at intake)
- [URL / file] — [2-3 bullet summary]
- [URL / file] — [...]
(or "None — clean start" if user said just go)

## Inherited assets (existing only)
- Brand: [URL or "none provided"]
- Existing product: [URL or "none"]
- Parent context summary: [2-3 bullets from the parent URL fetch]
```

These three sections sit at the top of `discovery.md`, above the standard sections.

### Phase 0 in Fast Mode (compressed)

Replace the current "If no idea was provided, ask: 'What's the idea? One sentence.'" with:

> "What's the idea, in one sentence? And anything I should read first — URL, doc, prior research? (Or just say 'no')."

Process:
- One-line idea capture
- Optional URL/file read (max 2 sources to keep Fast Mode fast)
- 1-bullet summary per source captured inline (not a separate `discovery.md` since Fast Mode is stateless)
- Continue to Fast Mode Step 2 (assumption catalog selection)

If the user provides an existing-product URL (e.g. "we're adding habit streaks to our journaling app at app.example.com"), Fast Mode adapts: the 3 assumptions picked include cannibalisation / inheritance framing where relevant.

## 2. Brand Identity (Phase 7) — gated on context type

```
if contextType == "new":
    offer BrandIt as today (full Phase 7 flow)
elif contextType == "existing":
    skip BrandIt by default
    optionally: "Want to refresh or extend the existing brand for this initiative? I can do a lightweight version of BrandIt that produces a sub-brand or campaign palette built on top of [parent brand]."
    if user accepts: run BrandIt in "extend" mode, producing brand-extension.md instead of brand.md
    if user declines: continue to Phase 8 (Final Review)
```

Outputs in the existing path:
- No `brand.md` written by default
- `brand-extension.md` written only if user opted into the extend flow
- Gamma deck uses **inherited brand assets** from `## Inherited assets` in `discovery.md`, not placeholders

## 3. Brand / Design / Gamma — boundary table

Documented in both `agents/proveit.md` (next to Phase 7 and Phase 10) and `docs/design.md`.

| Tool | Produces | Does NOT produce | When |
|------|----------|------------------|------|
| **BrandIt** | Brand SYSTEM: name, tagline, palette (full neutral scale + semantic colours), typography (Google Fonts), logo PNG, design tokens (CSS + JSON), tone of voice | UX, wireframes, screens, app icons, marketing copy beyond tagline, UI mockups | Phase 7 — only for `contextType: new` (or `existing` + extend opt-in) |
| **Claude Design** (claude.ai/design canvas) | Product UX: wireframes, user flows, screens, interaction states. Uses brand tokens as input. | Brand identity (assumes brand exists), engineering spec, marketing copy, palette / typography decisions | Phase 10 next-step — manual handoff: PM drops `discovery.md` + `brand.md` (or inherited assets) into a fresh design-canvas chat |
| **Gamma** | Stakeholder DECK: slides for leadership / funding / team. Uses brand for visual cohesion. | UX, engineering spec, brand identity, executable artefacts | Phase 9 Output 1 — auto-generated from synthesised content |

**Boundary enforcement:**
- BrandIt prompts must not produce wireframes or screens — only the brand system.
- Claude Design handoff prompts must not ask Claude to invent brand identity — they pass the existing brand tokens as input.
- Gamma deck generation must not be asked to produce UX or engineering spec — it stays at the stakeholder-narrative layer.

These constraints go in the relevant phase prompts as explicit "do not produce X" lines.

## 4. Swarm + prior-context wiring

Each swarm agent prompt template gets a new line:

```
[PRIOR_CONTEXT_FROM_DISCOVERY_MD]
```

inserted alongside `[DISCOVERY.MD CONTENTS]` and `[LATEST_RESEARCH CONTENTS]`. The Step 4 spawn instructions are updated to include the prior-context section automatically.

This applies to all 10 swarm agents AND:
- The synthesis agent (Step 5 of Phase 5)
- The cross-model review input (Phase 6)
- The pre-mortem agent (Phase 6.5)
- The Wave 3 scenario / experiment agent (Phase 6.7)

## 5. New file structure

```
[project-dir]/
├── discovery.md                       # Index — now opens with Context type, Prior context, Inherited assets
├── research-N.md
├── swarm-N-*.md                       # 6 default + 4 default-on-conditional
├── pre-mortem-N.md
├── scenarios-N.md
├── review-N.md
├── brand.md                           # Only if contextType=new AND BrandIt offered+accepted
├── brand-extension.md                 # Only if contextType=existing AND extend-brand opt-in
└── spec.md
```

## 6. Verification

No automated tests for prompt structure. Verification is real-world:

- **Run on a new idea:** Phase 0 should ask the context-type Q, the user picks new, prior-context Q is offered, user pastes a competitor URL, ProveIt fetches and summarises. `discovery.md` should have the three new sections at the top. BrandIt offered at Phase 7.
- **Run on an existing-iteration:** Phase 0 detects existing, asks for parent URL, fetches it, frames Defensibility around inheritance, **skips BrandIt automatically**, uses existing brand in Gamma deck.
- **Resume an existing session pre-v3.2:** ProveIt detects missing `## Context type`, runs catch-up Phase 0, then continues.
- **Fast Check with prior context:** `/proveit:proveit-fast` accepts a URL inline ("look at competitor.com first then validate this idea: ..."), fetches it, weaves findings into the 3-assumption output.

## 7. Anti-patterns to watch

- **Phase 0 friction:** if the new vs existing Q feels redundant or the prior-context Q feels intrusive, simplify. The Brain Dump's first question can absorb both ("what's the idea, and is it new or an iteration?"). If Phase 0 averages > 4 minutes, it's drifted into discovery territory.
- **BrandIt creep:** BrandIt prompts must explicitly state they don't produce UX. Same for Claude Design and brand. Watch the outputs in real runs.
- **Empty Inherited Assets:** if the existing-iteration path runs without the parent URL, that's a failure mode — set a hard requirement that `existing` requires a URL or app store link before continuing.
