# ProveIt

> *"Products don't fail at launch. They fail at the idea — when nobody checked if the problem was real, the market was big enough, or someone already tried and failed. You're about to make that bet. ProveIt checks the odds first."*

ProveIt is an evidence-based product validation tool for product managers. It takes a raw idea through structured discovery, automated competitor and market research, a configurable adversarial swarm, a falsifiable pre-mortem, an optional Wave 3 scenario and experiment phase, and a triple-output handoff bundle (stakeholder deck + engineering spec + validation playbook).

It exists as **two surfaces** that share the same methodology:

- **A Claude Code plugin** (`/proveit`) — full-fidelity, runs locally, agents have access to web search, [Lenny's Podcast MCP](https://github.com/akshayvkt/lenny-mcp) for current PM expert priors, optional brand identity generation, optional cross-model review via OpenAI o3, and a Gamma deck output. This README covers the plugin.
- **A web app** at **[https://proveit.tools/]** — public, no install, single-shot Fast Check or full conversational validation. See [`web/README.md`](web/README.md).

---

## Why I built this

Product managers I've worked with — and I've been one — have a recurring failure mode: they fall in love with an idea, do the work to write the PRD, get it on the roadmap, and only then discover the problem wasn't real, the market was already saturated, or the willingness-to-pay didn't exist. By that point, momentum and sunk cost mean the project ships anyway.

The available answers were all wrong-shaped:
- **A blank ChatGPT tab** — no structure, no method, no honesty about kill signals
- **A discovery sprint with 5 customer interviews** — useful but slow, and biased toward the people who agree to a 30-minute call
- **A formal stage-gate process** — too heavy, too late, kills the spark of the idea

ProveIt is what I wanted: a fast, structured, evidence-based preflight check that's honest enough to flag kill signals and rigorous enough to produce a real engineering handoff if the idea survives. It's grounded in named PM expert frameworks (Bob Moesta, Annie Duke, Teresa Torres, April Dunford, Madhavan Ramanujam, Hamilton Helmer, and others — see [Methodology](#methodology)), not in vibes.

---

## Table of contents

- [When to run it](#when-to-run-it)
- [What it does](#what-it-does)
- [Methodology](#methodology)
- [Pipeline (BrandIt + ShipIt)](#pipeline-brandit--shipit)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Resuming a session](#resuming-a-session)
- [What you get](#what-you-get)
- [Security model](#security-model)
- [Repository layout](#repository-layout)
- [Design notes](#design-notes)
- [License](#license)

---

## When to run it

Run ProveIt **before** you write a ticket, pitch a feature to your tech lead, or put something on the roadmap. It's a preflight check, not a post-analysis.

- **Fast check (10–15 min):** `/proveit:proveit-fast [your idea]` — surfaces the 3 assumptions most likely to kill this specific idea, picked from a 7-category adaptive catalog (not a fixed Desirability / Viability / Competition default)
- **Full validation (1–2 hrs):** `/proveit:proveit [your idea]` — structured discovery, automated research, scoring, deep-dive swarm (up to 10 agents, opt-out), pre-mortem, optional Wave 3 scenario + experiment artefacts, brand identity, handoff bundle

---

## What it does

The full validation runs as a series of named phases. Each one writes its own file to your working directory; nothing is buried in a giant document.

| Phase | What it does | Why it matters |
|---|---|---|
| **0. Intake** | Captures *context type* (new idea vs iteration on existing) and *prior context* (URLs, files, prior research the PM wants read first). 3 questions, ~3 minutes. | Lets ProveIt start warm rather than cold. Branches the rest of the flow — existing-iteration sessions automatically skip BrandIt and shift swarm framing toward inheritance. |
| 1. Brain Dump | Casual extraction — gets the idea out conversationally before frameworks kick in | Preserves the spark; PMs lose ideas in scaffolding |
| 2. Discovery | Targeted questions across Desirability, Viability, Feasibility (14 questions, anchored by Bob Moesta, Teresa Torres, Marty Cagan, Madhavan Ramanujam, Sean Ellis) | Identifies gaps before research; turns vague intent into testable claims |
| 3. Research | Three parallel tracks (competitor landscape, market evidence, viability signals) — minimum 9 searches, each round writes its own `research-N.md` | Evidence beats opinion; multiple rounds preserve a trail |
| 4. Findings Review | Confidence scores updated, kill signals flagged honestly | Stops the easy yes; surfaces the hard no |
| 5. Deep Dive *(optional)* | Opt-out swarm of up to 10 parallel agents arguing opposing angles, then synthesised — 6 defaults (incl. Defensibility) + 4 conditional (GTM, Pricing, AI Commoditization, Regulatory). ProveIt shows the proposed lineup before spawning; PM can trim. | Uses the full roster to pressure-test the sharpest open question; no lens left unchecked by default |
| 6. Cross-Model Review | OpenAI o3 reads everything and flags gaps, bias, logical leaps | Single-model bias is real; an independent reviewer catches it |
| **6.5. Pre-Mortem & Kill Criteria** | 3 falsifiable bets, calendar kill dates, "we keep going if" list | Founders quit too late, not too early. Annie Duke's framework, applied. |
| **6.7. Wave 3 — Scenario & Experiment** *(optional)* | 3 future scenarios with probability weights + real experiment artefacts (landing page copy, interview scripts, pricing-test page, technical spike spec) | Turns "things to validate" into paste-and-run assets. Anchored by Annie Duke, Lane Shackleton, Teresa Torres. |
| 7. Brand Identity *(gated on context type)* | For new ideas: full BrandIt run — name, logo, colours, fonts, tokens. For iterations on existing brand: skipped automatically; optional lightweight BrandIt-extend produces a campaign / sub-brand on top of the parent. | The deck and downstream design work need real brand assets. Skip it cleanly when the brand already exists; don't ask the PM to invent something they have. |
| 8. Final Review | Cross-model review #2 before outputs | Belt-and-braces |
| 9. Outputs | **Five** artefacts: Gamma deck (stakeholders) + Validation Playbook (PM) + `spec.md` PRD (engineering) + `design-brief.md` (synthesis any designer can read on its own) + `claude-design-prompts.md` (paste-ready prompts for the claude.ai/design canvas — deck, wireframes, logos, social cards) | Different audiences, different artefacts. The design-brief and prompts were added in v3.5 after a 5-probe study of claude.ai/design — the canvas rewards specificity at the prompt boundary, so ProveIt populates each prompt with the PM's evidence before the PM ever sees it. |
| 10. Next Steps | Three downstream tool paths with mostly non-overlapping outputs: `/orchestrate` to build · claude.ai/design for visual artefacts (paste a prompt from `claude-design-prompts.md`, or hit "Handoff to Claude Code" from any canvas to round-trip) · hand `spec.md` to engineering directly. Plus Gamma deck for stakeholders and Wave 3 scenarios if they ran. | This is the bridge between "idea" and "shippable". BrandIt and Claude Design overlap on logos only — the boundary table in Phase 7 / Phase 10 explains when each one wins. |

Additional commands:

- **`/proveit:dashboard`** — compare all your validated ideas side by side
- **`/proveit:retro`** — record what actually happened with an idea to calibrate future scoring

---

## Methodology

ProveIt's discovery questions and swarm agents apply named frameworks from product expert thinkers — many sourced live during research from [Lenny's Podcast](https://www.lennysnewsletter.com/podcast) via the [`lenny-mcp`](https://github.com/akshayvkt/lenny-mcp) integration. The agents both *carry* the embedded framework attributions AND *call* the MCP at runtime to pull current quotes from the relevant guests.

| Framework | Creator | Used in |
|-----------|---------|---------|
| Jobs-to-Be-Done · Switching forces · "Bitchin' ain't switchin'" | Bob Moesta | Discovery + Customer Impact swarm |
| Continuous Discovery + Opportunity Solution Tree | Teresa Torres | Discovery + Customer Impact + Wave 3 |
| Customer Discovery vs Delivery · Death by Features | Marty Cagan | Tech Feasibility + Devil's Advocate |
| ICP Scorecard | Ravi Mehta | Customer Impact |
| Pre-mortem · Levels of Strategy · Anti-patterns | Shreyas Doshi | Phase 6.5 + Devil's Advocate |
| Thinking in Bets / Quit | Annie Duke | Phase 6.5 — falsification, kill criteria; Phase 6.7 — probabilistic scenario framing |
| Tarpit Detection ("just don't die") | Dalton Caldwell (YC) | Market Bear + Pre-Mortem |
| Founder Mode | Brian Chesky | Devil's Advocate |
| PMF Test ("very disappointed") | Sean Ellis | Discovery, Findings, Pre-Mortem, Wave 3 |
| Network Effects + Blitzscaling | Reid Hoffman | Market Bull + Defensibility swarm |
| Obviously Awesome Positioning | April Dunford | GTM swarm |
| Growth Loops vs Funnels | Brian Balfour / Elena Verna | GTM swarm + Defensibility |
| North Star + Adjacent Users | Bangaly Kaba | GTM swarm |
| PLG Benchmarks | Kyle Poyar | GTM + Pricing |
| Monetizing Innovation (incl. AI anchoring) | Madhavan Ramanujam | Pricing swarm |
| Pricing data + cohort analysis | Patrick Campbell | Pricing swarm |
| Value Proposition Canvas | Strategyzer | Discovery |
| "Market is the most important thing" | Marc Andreessen | Market Bear |
| *7 Powers* (Scale Economies, Network Economies, Counter-Positioning, Switching Costs, Branding, Cornered Resource, Process Power) | Hamilton Helmer | Defensibility swarm |
| 4-Step Defensibility Cycle | Brian Balfour | Defensibility swarm |
| Proprietary data flywheels | Peter Deng | Defensibility swarm |
| Marketplace defensibility · AI economics | Dan Hockenmaier | Defensibility swarm + AI Commoditization swarm |
| "AI lowers the floor, doesn't raise the ceiling" | Ben Horowitz | AI Commoditization swarm |
| *Designing Machine Learning Systems* · production ML reality | Chip Huyen | AI Commoditization swarm |
| AI products in practice · wrapper-vs-product distinction | Claire Vo | AI Commoditization swarm |
| AI-native vs AI-feature · scenario thinking | Mike Krieger | AI Commoditization swarm + Wave 3 |
| *Crossing the Chasm* · regulated-market chasms | Geoffrey Moore | Regulatory swarm |
| Building in regulated industries | Hilary Gridley | Regulatory swarm |
| Regulated platform thinking | David Singleton | Regulatory swarm |
| Retention loops | Adriel Frederick | Customer Impact swarm |
| Habit formation | Albert Cheng | Customer Impact swarm |
| *Hooked* (trigger → action → variable reward → investment) | Nir Eyal | Customer Impact swarm |
| Operations-heavy product economics | Brian Tolkin | Tech Feasibility swarm |
| Service-heavy unit economics · software vs labour gross margins | Ray Cao | Tech Feasibility swarm |
| Scenario planning in engineering orgs | Camille Fournier | Wave 3 |
| Experiment design | Lane Shackleton | Wave 3 |

---

## Pipeline (BrandIt + ShipIt)

ProveIt connects to two sister tools for an idea-to-product flow:

```
/proveit  →  /brandit  →  claude.ai/design  →  /orchestrate
 validate    brand it    design the UI       build it
```

Each step is optional. ProveIt offers BrandIt in-session before generating the deck, and suggests `/orchestrate` after handing off the `spec.md` PRD.

---

## Prerequisites

**Required:**
- **Claude Code** (latest) — [install](https://claude.ai/download)
- **Node.js** ≥ 20 — [install](https://nodejs.org)

**Recommended MCP integrations:**
- **Firecrawl** — deep web research and competitor analysis (required for serious research; ProveIt falls back to WebSearch/WebFetch without it)
- **Gamma** — generates the technical handoff presentation in Phase 9 (skipped gracefully if absent)
- **Lenny's Podcast MCP** — runtime PM expert priors. Install with `claude mcp add -t http -s user lenny-transcripts https://lenny-mcp.onrender.com/mcp`. Source: [akshayvkt/lenny-mcp](https://github.com/akshayvkt/lenny-mcp).

**Optional:**
- `OPENAI_API_KEY` — enables the o3 cross-model review in Phase 6 and Phase 8, plus DALL-E logo generation in BrandIt. Skipped gracefully if missing.

---

## Installation

```bash
git clone https://github.com/cla1redonald/proveit.git ~/proveit
cd ~/proveit
./setup.sh
```

To uninstall:

```bash
cd ~/proveit
./setup.sh --uninstall
```

<details>
<summary>Manual installation</summary>

Add these keys to `~/.claude/settings.json` (merge — don't replace the whole file):

```json
{
  "extraKnownMarketplaces": {
    "proveit": {
      "source": {
        "source": "directory",
        "path": "/absolute/path/to/proveit"
      }
    }
  },
  "enabledPlugins": {
    "proveit@proveit": true
  }
}
```

</details>

---

## Quick start

Create a directory for your idea and start validating:

```bash
mkdir ~/my-idea && cd ~/my-idea
```

Then in Claude Code:

```
/proveit I want to build a habit tracker for remote teams
```

ProveIt will get the idea out conversationally, run structured discovery, research competitors and market evidence, score confidence, and flag any kill signals honestly. After research, it offers a Deep Dive on the sharpest open question — defaulting to the full 10-agent swarm (with opt-out). After the swarm, it runs a pre-mortem with falsifiable kill criteria and offers Wave 3 scenario planning with real experiment artefacts.

For the rapid version (10–15 min, 3 critical assumptions only):

```
/proveit:proveit-fast I want to build a habit tracker for remote teams
```

---

## Resuming a session

Everything ProveIt writes lives in your working directory. To resume:

```bash
cd ~/my-idea
/proveit
```

It reads `discovery.md`, checks what research has already been done, summarises where you left off, and picks up from there.

---

## What you get

Every output is a standalone markdown file in your working directory — shareable, pasteable, no dependencies. None are committed to git.

### `discovery.md` — the index

Stays lightweight throughout the session:
- Confidence scores (Desirability / Viability / Feasibility, updated after every phase)
- Brain dump and discovery Q&A
- **Live Bets** (added by Phase 6.5) — the 3 critical bets with calendar kill dates, glanceable any time
- Links to all research and swarm files
- Kill signals (if any)
- Recommendation
- Validation playbook

### `research-N.md` — one file per research round

Each contains: competitor landscape (active + dead + funded), market evidence (real users expressing the pain on Reddit/HN/forums), tarpit check, viability signals (pricing, market size, investor activity). Loops never overwrite — `research-2.md` lives alongside `research-1.md`.

### `swarm-N-*.md` — Deep Dive output (if Phase 5 runs)

Up to 10 parallel agents — 6 defaults (Market Bull, Market Bear, Customer Impact, Technical Feasibility, Devil's Advocate, Defensibility) plus 4 default-on-conditional (GTM, Pricing, AI Commoditization, Regulatory) — each writing their angle. ProveIt shows the proposed agent lineup with per-agent reasoning before spawning; the PM can remove any. A synthesis agent reads all of them and produces `swarm-N-synthesis.md` with executive summary, direct contradictions, bias check, score impact, and next steps.

### `pre-mortem-N.md` — falsifiable kill criteria (Phase 6.5)

The decision-support artefact. Contains: a past-tense story of how the idea failed, the 3 critical bets being made by proceeding (each with a falsification test, pass criteria, and calendar kill date), failure modes ranked by likelihood × severity, operational kill criteria, and a "we keep going if" inverse list.

### `scenarios-N.md` — Wave 3 scenario planning + experiments (Phase 6.7, optional)

Three future scenarios (best / expected / kill case) with explicit probability weights, decision quality assessment, and real experiment artefacts for each of the 3 critical bets from the pre-mortem — landing page copy, interview scripts, pricing-test pages, and technical spike specs written as production-ready strings, not descriptions. Anchored by Annie Duke (probabilistic framing), Lane Shackleton (experiment design), Teresa Torres (assumption testing), Camille Fournier (scenario planning).

### `review-N.md` — cross-model review (if `OPENAI_API_KEY` is set)

OpenAI o3 reads everything and flags gaps, bias, logical leaps, contradictions. CRITICAL findings get incorporated into scores. NOTABLE findings are surfaced for PM judgement.

### `brand.md` — brand identity (if BrandIt phase runs)

Complete brand guidelines: name, tagline, colours (full neutral scale + semantic), typography (Google Fonts), tone of voice, spacing, border radius, shadows. Plus `brand-tokens.css` and `brand-tokens.json` for direct import into your build, and logo PNGs (DALL-E generated).

### `spec.md` — engineering PRD (Phase 9 Output 3)

A structured PRD that drops cleanly into Linear, Jira, or Notion. Critically, the success metrics in `spec.md` are pulled directly from the kill criteria in `pre-mortem-N.md` — so the team's leading indicators are the same conditions the PM committed to monitor. No metric divergence between strategy and delivery.

### Gamma presentation

Stakeholder / leadership deck — 9 slides covering the problem, market landscape, opportunity, target user, business model, what to build (high-level, not technical), size and complexity, remaining unknowns + Live Bets, and recommended next steps.

---

## Security model

This repo commits **zero Bash permission allows** in `.claude/settings.json`. Anyone who clones it will be prompted to approve every command individually. This is intentional — see [ShipIt's security rationale](https://github.com/cla1redonald/shipit-v2) for why shared repos should never pre-approve command execution.

The agent never sees your API keys directly — they're only loaded by the Claude Code runtime when calling the relevant MCP server. Generated research files are gitignored by default to prevent accidental exposure of competitor analysis or business strategy.

---

## Repository layout

```
proveit/
├── agents/proveit.md           # The main agent definition (Opus model)
├── commands/                   # Slash command entry points
│   ├── proveit.md              # /proveit — full validation
│   ├── proveit-fast.md         # /proveit-fast — 10-15 min preflight
│   ├── proveit-dashboard.md    # /proveit:dashboard — portfolio comparison
│   └── proveit-retro.md        # /proveit:retro — calibration retrospective
├── docs/
│   ├── design.md               # Long-form design doc (v3.1)
│   ├── frontier-snapshot.md    # Living, dated record of the AI frontier (AI-currency engine)
│   ├── plans/                  # Dated plans for major changes
│   └── specs/                  # Dated implementation specs
├── scripts/
│   ├── openai-review.mjs           # Cross-model review (second-opinion model)
│   └── frontier-scan.workflow.mjs  # Dynamic workflow: refreshes the frontier snapshot
├── .github/workflows/
│   └── frontier-scan.yml       # Biweekly scheduled scan → opens a PR (AI-currency engine)
├── web/                        # The standalone web app (proveit.tools)
├── .claude/settings.json       # No bash allows by default
├── setup.sh                    # Install / uninstall script
└── CLAUDE.md                   # Agent-side instructions
```

### Staying current — the AI-currency engine

The world of AI moves fast, so ProveIt keeps its own knowledge of the frontier current **without anyone driving it**. `docs/frontier-snapshot.md` is a dated, source-checked record of what the foundation-model layer can do *today* — what each lab shipped recently, what just became a default (and so is no longer a moat), the token-cost curve, and the build/design tooling landscape. The AI-Commoditization analysis reads it first instead of relying on a training cutoff.

It is regenerated by the `frontier-scan` **dynamic workflow** (`scripts/frontier-scan.workflow.mjs`) — fan-out one researcher per lab → an adversarial skeptic kills any claim without a dated source → synthesize → diff the prior snapshot. A scheduled GitHub Action runs it biweekly in the cloud and **opens a PR**: routine refreshes you just merge; frontier shifts big enough to touch the agent arrive as `PROPOSED-AGENT-EDITS.md` for human review. The agent's brain is never edited unattended — matching the repo's review-everything security posture. One-time setup: add the `ANTHROPIC_API_KEY` repo secret.

---

## Design notes

A few decisions worth knowing if you're evaluating the engineering:

**Frameworks are embedded as durable structure, MCP search is for runtime context.** The agents carry named expert frameworks (Annie Duke, Bob Moesta, Hamilton Helmer, Madhavan Ramanujam, etc.) directly in their prompts — that's load-bearing, not decorative. The Lenny MCP gives them a callable tool to verify and extend during research, not the source of truth. Pure runtime-search would be fragile (agents reinvent queries every session); pure prompt-bake would age (embedded framings go stale). Hybrid wins.

**The swarm is opt-out, not opt-in.** The default is to run all agents that apply — 6 always-on plus up to 4 conditional agents that fire based on the idea profile (AI surface, regulated category, distribution uncertainty, pricing uncertainty). ProveIt states the proposed full set with per-agent reasoning before spawning; the PM gets one chance to remove any. The cost of running an extra agent is small; the cost of missing a relevant lens is structural.

**Defensibility is now a default swarm agent.** Every idea must answer "why won't this be copied?" — that's a different question from "is the market real?". The Defensibility agent anchors on Hamilton Helmer's *7 Powers* and produces a mandatory 7 Powers Mapping table. It fires by default, not conditionally.

**The Fast Check picks 3 assumptions from a 7-category catalog, not a fixed default.** The catalog — Desirability, Viability, Competition, Distribution, Defensibility, AI Commoditization, Regulatory — covers the full kill-signal surface. ProveIt picks the 3 most likely to kill *this specific idea* and states the reasoning before researching. A B2B HR tool gets Viability + Regulatory + Defensibility; a consumer AI app gets Desirability + AI Commoditization + Distribution.

**Wave 3 produces real artefacts, not descriptions.** The experiment artefacts in `scenarios-N.md` are production-ready strings — landing page copy to paste into Webflow, interview scripts to paste into Calendly/Notion, pricing-test page copy, technical spike specs. The pm-facing Validation Playbook says "run a landing page test"; Wave 3 writes the test.

**Pre-mortem produces calendar kill dates, not "things to validate".** The falsification tests in `pre-mortem-N.md` each have an explicit "kill date" and "pass criteria". The PM is committing in writing to a stop condition. This is Annie Duke's central point applied to product validation: people quit too late, not too early.

**The success metrics in `spec.md` come from the pre-mortem.** Engineering's leading indicators are the same conditions the PM is using as kill criteria. No metric divergence between strategy and delivery — a quiet but important property of the handoff bundle.

**Single agent on Opus, all subagents on Sonnet.** Cost-efficient. Opus does the judgement work (discovery scoring, deep-dive question crafting, pre-mortem framing, validation playbook). Sonnet does the structured/parallel work (research subagents, swarm agents, deck generation, brand directions).

**Files are standalone Markdown.** Every output is shareable, pasteable, has no proprietary dependencies. The PM can stop using ProveIt mid-session and the artefacts remain useful.

---

## License

MIT — see [LICENSE](LICENSE).
