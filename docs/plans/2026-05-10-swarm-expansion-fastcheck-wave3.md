# Plan: Swarm Expansion, Adaptive Fast Check, and Wave 3 Scenario+Experiment

**Date:** 2026-05-10
**Author:** Claire Donald
**Status:** In progress
**Related spec:** [`docs/specs/2026-05-10-swarm-expansion-fastcheck-wave3.md`](../specs/2026-05-10-swarm-expansion-fastcheck-wave3.md)

## Why now

After v3.0 shipped (commit `81ae8c9`, agent maturation pass), we ran a structured audit of the current agent roster against Lenny's Podcast archive (live MCP queries) to identify gaps. Three real ones surfaced:

1. **Defensibility / Moat** — no current agent debates "why won't this be copied?". The most common quiet death for non-network-effect products. Strong Lenny coverage: Hamilton Helmer (7 Powers), Brian Balfour (4-step defensibility cycle), Peter Deng (data flywheels), Dan Hockenmaier (marketplace defensibility).

2. **AI Commoditization / Wrapper Risk** — sharpest risk for AI-era products and structurally relevant given that ~half of Claire's portfolio touches AI. Tech Feasibility argues "can we build it" but never "will OpenAI ship this in Q3?". Lenny anchors: Ben Horowitz (strategic AI), Chip Huyen (ML systems), Claire Vo (AI products), Brian Balfour, Dan Hockenmaier.

3. **Regulatory / Compliance** — for ideas in health, finance, kids' content, data privacy, employment, lending, education. Currently zero coverage. Lenny anchors: Geoffrey Moore (chasm in regulated markets), Hilary Gridley, David Singleton.

Two soft gaps fold into existing agents rather than become new ones:
- Retention / habit → Customer Impact (Adriel Frederick, Albert Cheng on retention loops)
- Operations / unit economics → Technical Feasibility + Pricing (Brian Tolkin, Ray Cao on ops-heavy product economics)

## Decisions

### 1. Three new agents, one promoted to default

- **Defensibility / Moat** — promoted to **default** tier (was new; intended-conditional). Every idea must answer this question regardless of category. Without explicit defensibility debate, the swarm's bull/bear stays at "is the market real?" and skips "is the position defensible?" — a different question.
- **AI Commoditization** — added as conditional, fires when idea is AI-powered or AI-feature-of-something-else.
- **Regulatory / Compliance** — added as conditional, fires for regulated categories.

### 2. Swarm composition: opt-out, not opt-in

Per Claire's preference, the swarm now defaults to running **all 10 agents** for any idea that warrants the conditional ones, and asks the user which (if any) to skip. Reverses the v3.0 "5 default + ask to add" model.

Rationale: the cost of running an extra agent is small (Sonnet token cost + a few minutes); the cost of MISSING a relevant lens is structural (you don't see what you didn't ask). Defaulting to thorough and trimming where unnecessary is the right shape.

ProveIt states the proposed full set with reasoning per agent before spawning. The PM can object before agents fire.

The 10 agents:

| # | Agent | Tier | Skip when |
|---|-------|------|-----------|
| 1 | Market Bull | Default | — |
| 2 | Market Bear | Default | — |
| 3 | Customer Impact (with retention/habit folded in) | Default | — |
| 4 | Technical Feasibility (with operations folded in for service-heavy ideas) | Default | — |
| 5 | Devil's Advocate | Default | — |
| 6 | **Defensibility / Moat** | **Default (NEW)** | — |
| 7 | GTM / Distribution | Default-on-conditional | Skip if deeply embedded internal tooling with captive audience |
| 8 | Pricing / Monetisation | Default-on-conditional | Skip if pricing is well-understood (e.g. standard SaaS per-seat with established anchors) |
| 9 | **AI Commoditization** | **Default-on-conditional (NEW)** | Skip if idea has zero AI surface |
| 10 | **Regulatory** | **Default-on-conditional (NEW)** | Skip if idea is in an unregulated category (most consumer software) |

### 3. Adaptive Fast Check — catalog of 7 assumption categories

Replace the hardcoded "Desirability / Viability / Competition" with a catalog. The Fast Check picks **the 3 most-likely-to-kill** for the specific idea profile, with explicit selection guidance per category:

| Category | Default for | Skip when |
|----------|-------------|-----------|
| Desirability | New categories, unfamiliar problems | Pain is already well-documented (hire-fire dynamic established) |
| Viability | Paid products, especially B2B | Free / portfolio piece where commercial isn't the question |
| Competition | Crowded landscapes, recognisable categories | Genuinely novel space with no analogues |
| Distribution | Consumer-facing, content-led, viral mechanics | Captive audience already obvious (e.g. internal tool for known team) |
| Defensibility | Anything that scales | Idea is service-only with no software leverage |
| AI Commoditization | AI-powered or AI-feature ideas | Zero AI surface |
| Regulatory | Health, finance, kids, data, employment, lending, education | Clearly unregulated (general consumer SaaS) |

For a **Wedding Speech Roaster** (consumer + AI + crowded) the Fast Check should pick Desirability + AI Commoditization + Distribution, not the default DVC.

For a **B2B SaaS for HR** (paid, regulated, embedded) it should pick Viability + Regulatory + Defensibility.

### 4. Wave 3: Scenario & Experiment Phase

New **optional** phase after Phase 6.5 Pre-Mortem. The first three waves are about *gathering evidence* (Discovery → Research → Swarm). Wave 3 is about *acting on it*:

- **3 future scenarios** — best case / expected case / kill case — each grounded in the swarm + pre-mortem evidence, named with specific market/competitor moves
- **Probability weights** — Annie Duke / Bayesian framing. "What's your honest probability on each?"
- **Executable experiment artefacts** — currently the Validation Playbook says "run a landing page test"; Wave 3 actually *generates* the landing page copy, the interview script, the pricing-test page, the technical spike spec. Real artefacts the PM can paste and run.

Anchored by:
- Annie Duke (probabilistic thinking, decision quality vs outcome quality)
- Camille Fournier (scenario planning in engineering orgs)
- Mike Krieger (AI product scenario thinking)
- Lane Shackleton (experiment design)
- Teresa Torres (assumption testing → experiment design)

This is what turns ProveIt from "validates ideas" into "validates and de-risks ideas". The latter is genuinely differentiated vs ChatGPT, Maze AI, Dovetail.

### 5. Citations everywhere

Every agent prompt, every phase intro, every framework reference cites the named expert. Where Lenny's Podcast has a specific episode or quote, suggest the search query. Where a book is the canonical source (Hamilton Helmer's *7 Powers*, Annie Duke's *Thinking in Bets / Quit*, Madhavan Ramanujam's *Monetizing Innovation*, April Dunford's *Obviously Awesome*, Geoffrey Moore's *Crossing the Chasm*), reference the book by title alongside the guest.

## Out of scope (deferred)

- **Founder/market fit agent** — Lenny coverage is diffuse and the question is too tied to *the specific founder* to be answered well by a generic agent. Better as a Discovery question.
- **A "pivot" agent** — Annie Duke (quit) and the pre-mortem already cover this. Adding more would be redundant.
- **A "wedge" agent** — folds naturally into GTM (April Dunford positioning IS the wedge framework).
- **Web app parity** with new agents — gated on the strategic decision in #20 (paid product vs portfolio piece). If portfolio-only, the plugin's the canonical surface; if paid product, the web app eventually grows the new lenses.

## Migration / risks

- **Existing in-flight sessions** — `discovery.md` files that pre-date these changes won't have references to the new agents. Phase 5 will spawn the new agents on the next swarm round; no migration needed.
- **Token cost** — defaulting to all 10 agents adds ~50–100% to swarm cost vs the v3.0 5-default model. Mitigated by the opt-out preview ("here's what I'd run; remove any that don't apply") which gives the user one chance to trim before spawn.
- **Synthesis volume** — 10 swarm files instead of 5 means the synthesis agent reads more. Token-bounded but the structure is the same.
- **Wave 3 is optional** — added as opt-in so existing sessions aren't disrupted.

## Verification

No automated tests for agent prompts. Verification is real-world:

1. **Wedding Speech Roaster** Fast Check should now pick Desirability + AI Commoditization + Distribution (not DVC) — first signal that the adaptive catalog is working.
2. **A future Full Validation** with the strategic-validation idea should run the 10-agent swarm by default and grapple explicitly with defensibility, AI commoditization, and (where relevant) regulatory.
3. **Wave 3 should produce real artefacts** — actual landing page copy, not "draft a landing page".

Outcomes to watch:
- Does the user actually skip any agents on the opt-out flow, or is full-10 the steady state? If the steady state is full-10, simplify by removing the opt-out preview.
- Does Wave 3's experiment generation produce paste-ready artefacts, or vague templates? If templates, the prompt needs another pass.
- Does the Fast Check's category choice match what the user would have picked? If consistently off, the selection rubric needs sharpening.

## Implementation order

1. Plan doc (this file)
2. Defensibility agent
3. AI Commoditization agent
4. Regulatory agent
5. Customer Impact + Tech Feasibility fold-ins (retention + ops)
6. Refactor swarm to opt-out model with all 10 default
7. Adaptive Fast Check catalog
8. Wave 3: Scenario & Experiment phase
9. Spec doc
10. Docs sync via @docs (README, design.md, GitHub Release v3.1.0, issue comments)
