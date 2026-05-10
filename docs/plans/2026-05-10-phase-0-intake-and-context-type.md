# Plan: Phase 0 Intake, New-vs-Existing Context Type, and Brand/Design/Gamma Boundary

**Date:** 2026-05-10
**Status:** Implemented in v3.2
**Related spec:** [`docs/specs/2026-05-10-phase-0-intake-and-context-type.md`](../specs/2026-05-10-phase-0-intake-and-context-type.md)

## Why now

Two real gaps surfaced after the v3.1 swarm expansion:

1. **The methodology assumes green-field.** Brand Identity (Phase 7) is offered to every session, but plenty of ProveIt runs are *iterations on existing products / features for an existing brand*. Offering BrandIt for those is wrong-shaped.
2. **Sessions start cold.** The Brain Dump asks "tell me the idea" with no input from prior work. PMs often have artefacts they want fed in first — competitor URLs, an old PRD, customer interview notes, a Notion doc. Currently those get pasted into a discovery answer mid-flow, which loses context for everything before that question.

A third sub-question: **how does Claude Design relate to BrandIt and Gamma?** The current Phase 10 mentions claude.ai/design as a manual handoff option, but the boundaries between the three tools (BrandIt → brand system, Claude Design → UX, Gamma → stakeholder deck) aren't explicit anywhere. Without explicit boundaries the tools risk drifting into each other's territory.

## Decisions

### 1. New Phase 0 — Intake (runs first, before Brain Dump)

Three questions, ~3 minutes for the full flow. Compressed to one line for Fast Mode.

**Q1: Context type.** "Is this a new business / product idea, or an iteration on something existing?"

- **New** → continue with full default flow including BrandIt offer in Phase 7
- **Existing** → ask for the parent product/brand URL, fetch it, capture in `discovery.md`. Set `contextType: existing` flag that:
  - Skips BrandIt automatically in Phase 7 (brand already exists)
  - Shifts swarm framing so Defensibility asks "what existing moats does the parent have that this inherits?" instead of "what moat could this build?"
  - Surfaces cannibalisation, internal-politics, why-now-not-3-months-ago questions in Discovery
  - Uses the existing brand assets in the Gamma deck (no placeholder branding)

**Q2: Prior context.** "Anything I should read before we start? URLs, files, prior research, competitor sites, an existing PRD?"

- User can list URLs (WebFetch / Firecrawl), file paths (Read), or "no, just go"
- ProveIt reads each, summarises in 2-3 bullets per source
- Captures references in `discovery.md` under a new `## Prior context` section
- The summary becomes part of the input passed to all subsequent phases AND all swarm agents

**Q3: Where it lives** *(only if existing)*. "Existing product URL or app store link?" Fetch it, derive the current product as the *starting position* for the iteration.

### 2. BrandIt becomes truly optional, gated on context type

- `contextType: new` → BrandIt offered as today (Phase 7)
- `contextType: existing` → BrandIt skipped automatically. Optional "refresh / extend the existing brand for this initiative?" hook offered, but the default is skip.

### 3. Claude Design / BrandIt / Gamma — explicit boundary

Three complementary tools with non-overlapping outputs. Documented as a boundary table in both `agents/proveit.md` (near Phase 7 + Phase 10) and `docs/design.md`.

| Tool | Produces | Does NOT produce | When it runs |
|------|----------|------------------|--------------|
| **BrandIt** | Brand SYSTEM — name, tagline, palette (with neutral scale + semantic colours), typography (Google Fonts), logo PNG, design tokens (CSS + JSON), tone of voice | UX, wireframes, screens, app icons, marketing copy beyond tagline | Phase 7 — only for `contextType: new` |
| **Claude Design** (claude.ai/design canvas) | Product UX — wireframes, user flows, screens, interaction states. Uses brand tokens as input. | Brand identity (assumes one already exists), engineering spec, marketing copy | Phase 10 next-step (manual handoff: PM drops `discovery.md` + `brand.md` into a fresh design-canvas chat) |
| **Gamma** | Stakeholder DECK — slides for the leadership / funding / team conversation. Uses brand for visual cohesion. | UX, engineering spec, brand identity, executable artefacts | Phase 9 Output 1 — auto-generated from synthesised content |

The risk we're guarding against: BrandIt drifting into "let me also sketch the home page", or Claude Design drifting into "let me also pick the colours". The boundary table makes those drifts visible.

### 4. Swarm + prior-context wiring

All 10 swarm agents (and the synthesis agent, the cross-model review, the pre-mortem, Wave 3) now receive the **prior-context summary from Phase 0** as part of their input, alongside `discovery.md` and the latest `research-N.md`. This means the agents reason from what the PM already knows, not just what they themselves can find via search.

Implementation: insert `[PRIOR_CONTEXT]` token in agent prompts where `[DISCOVERY.MD CONTENTS]` already appears.

## Out of scope (deferred)

- **Web app** — Phase 0 is a parity item for issue #21 but not built in this pass; the web app stays at lighter scope until #20 strategic decision lands.
- **Automated artefact intake** (e.g. paste a Figma URL and have ProveIt fetch the design) — manual URL/file paste is sufficient for v3.2; richer artefact handling can wait.
- **Voice memo / audio file intake** — out of scope. Could be added later via Whisper, but the value-per-effort is low compared to URL/file/text paste.

## Migration / risks

- **Existing in-flight sessions** — `discovery.md` files that pre-date v3.2 won't have a "## Context type" section. On resume, ProveIt detects the absence and runs a quick Phase 0 catch-up before continuing. Existing files aren't rewritten retroactively.
- **Token cost** — Phase 0 reads up to ~5 URLs / files at the start. Bounded; the user controls how much context they hand over. The summaries (2-3 bullets per source) keep the downstream prompt size manageable.
- **PM friction** — adding a phase BEFORE Brain Dump risks slowing the "I just want to start" path. Mitigated by: Phase 0 is short (3 questions), the prior-context question accepts "no, just go", and the new-vs-existing question is binary.

## Verification

- A `/proveit` run on a **brand new idea** should: detect `new`, ask the prior-context question, run Brain Dump → ... → offer BrandIt at Phase 7.
- A `/proveit` run on **"a habit-streak feature for our existing journaling app at app.example.com"** should: detect `existing`, fetch app.example.com, write parent context to `discovery.md`, **skip BrandIt at Phase 7 by default**, frame Defensibility as inheritance question, use existing brand in Gamma deck.
- A `/proveit:proveit-fast` run with the user pasting a competitor URL in the prior-context slot should fetch that URL and weave its findings into the 3-assumption Fast Check evidence.

## Implementation order

1. Plan + spec docs (this file + spec)
2. Phase 0 in `agents/proveit.md` (full mode)
3. Phase 0 lightweight in Fast Mode
4. Brand Identity (Phase 7) gated on context type
5. Swarm prompts reference prior context
6. Boundary table in agents/proveit.md and design.md
7. Update README + design.md + web/README
8. Commit, push, release v3.2.0, comment on #21
