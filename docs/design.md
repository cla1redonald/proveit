# ProveIt — Design Document

**Version:** 3.0
**Date:** 2026-05-09
**Author:** Claire Donald

## Changelog

- **3.0 (2026-05-09)** — Agent maturation pass. Added Phase 6.5 Pre-Mortem & Kill Criteria, Output 3 (`spec.md` PRD), claude.ai/design canvas handoff in Phase 10, and a menu-driven Deep Dive swarm (5 defaults + 2 conditional agents: GTM/Distribution and Pricing/Monetisation). Integrated [`lenny-mcp`](https://github.com/akshayvkt/lenny-mcp) so the agents and swarm subagents can pull current PM expert context from Lenny's Podcast at runtime. Embedded named frameworks (Annie Duke, Bob Moesta, Teresa Torres, Madhavan Ramanujam, April Dunford, Dalton Caldwell, etc.) directly into agent prompts as durable structure.
- **2.0 (2026-03-15)** — Phase restructure (named phases, seamless pipeline), in-session BrandIt, Cross-Model Review (o3) checkpoints, Portfolio Dashboard, Calibration Retro, Research Steering.

## What is ProveIt?

ProveIt is a Claude Code plugin that helps product managers validate ideas before committing technical resources. It takes a raw idea through Desirability (do users want it?), Viability (can it be a business?), and light Feasibility (how big is the build?) — then produces a structured handoff bundle (Gamma deck + PRD spec + validation playbook + optional brand and design assets) so engineering, design, and stakeholders each get the artefact they actually need.

**Tagline:** "ProveIt first, then build it."

## The Problem

PMs have ideas but no structured way to validate them before pulling in engineers. They either:
- Skip validation and jump to building (waste)
- Do ad-hoc research that's inconsistent and gets lost
- Write PRDs based on assumptions, not evidence

## Core Loop

ProveIt runs one iterative loop. It is NOT linear — it cycles until confidence is high enough.

```
Brain Dump → Discovery → Research → Findings Review
                                                      ↓
                                              Deep Dive (optional)
                                                      ↓
                                              ★ Cross-Model Review (post-deep-dive)
                                                      ↓
                                              ★ Pre-Mortem & Kill Criteria  ← NEW (Phase 6.5)
                                                      ↓
                                              Confidence high enough?
                                               No → back to Discovery
                                              Yes → Brand Identity (optional, in-session)
                                                      ↓
                                              ★ Final Review (pre-output)
                                                      ↓
                                              Outputs:
                                              - Branded Gamma deck (stakeholder conversation)
                                              - Validation Playbook (in discovery.md)
                                              - spec.md PRD (engineering handoff)  ← NEW (Output 3)
                                                      ↓
                                              Next Steps:
                                              - /orchestrate to build
                                              - claude.ai/design for UX flows  ← NEW
                                              - share deck / hand spec to engineering
```

### 1. Brain Dump (runs once)

Casual, conversational extraction. Get the raw idea out fast. 5-6 open questions max.

Goal: capture the emotional intent and raw concept before structure kicks in. PMs often lose the spark in frameworks — this preserves it.

Questions:
- "What's the idea? Just tell me."
- "What made you think of this?"
- "Who's it for?"
- "What do they do today instead?"
- "Why now?"

After: summarise back in 2-3 sentences, confirm understanding.

### 2. Discovery (loops)

Targeted questions across three lenses. ProveIt checks what the brain dump already covered and fills gaps.

**Frameworks this phase applies** (added v3.0):

The 14 questions sit on top of named frameworks. When you reach for a question, reach for the framework underneath it; pull supporting context from Lenny's archive when you need a sharper lens.

| Lens | Frameworks | Lenny search seeds |
|------|------------|---------------------|
| Desirability | Bob Moesta (JTBD, switching forces, "Bitchin' ain't switchin'"), Teresa Torres (continuous discovery, opportunity solution tree), Marty Cagan (discovery vs delivery), Ravi Mehta (ICP scorecard) | "switching forces", "jobs to be done", "continuous discovery", "ICP" |
| Viability | Madhavan Ramanujam (Monetizing Innovation — discover WTP before building, don't anchor low especially with AI), Marc Andreessen ("market is the most important thing"), Sean Ellis (PMF survey 40% bar), Shreyas Doshi (pre-mortem in question form) | "willingness to pay", "monetizing innovation", "PMF survey", "pricing strategy" |
| Feasibility (light) | Marty Cagan (feasibility as a discovery risk, not a spec request) | "build vs buy", "technical feasibility" |

**Desirability (User lens)**

| # | Question | Reveals |
|---|----------|---------|
| 1 | "Who specifically has this problem? Describe a real person." | Concrete user vs vague segment |
| 2 | "What do they do today to solve this? Walk me through it." | Current workaround = real competitor |
| 3 | "What's painful about how they do it today?" | Actual pain vs assumed pain |
| 4 | "How painful? Do they complain, or actually try to fix it?" | Stated frustration vs switching behaviour |
| 5 | "If your solution existed tomorrow, what would they stop using?" | Displacement thinking (Bob Moesta) |
| 6 | "How would they find out it exists?" | Distribution signal |

**Viability (Business lens)**

| # | Question | Reveals |
|---|----------|---------|
| 7 | "Would someone pay for this? Who, and roughly how much?" | Willingness to pay |
| 8 | "How would the money work? Subscription, one-time, freemium?" | Business model shape |
| 9 | "How big is this market? Thousands or millions?" | Gut-check sizing |
| 10 | "What would make this a terrible business even if people loved it?" | Pre-mortem (Shreyas Doshi) |
| 11 | "Is anyone already making money solving this?" | Market existence signal |

**Feasibility (Technical lens — light touch)**

| # | Question | Reveals |
|---|----------|---------|
| 12 | "Does this need to connect to anything? APIs, hardware, other systems?" | Integration complexity |
| 13 | "Does this need real-time anything? Live data, collaboration, notifications?" | Architecture complexity |
| 14 | "Is there anything here that feels technically hard or uncertain?" | PM's own intuition on risk |

**Flow:**
- Don't fire all 14 in order
- Check what brain dump already answered
- Identify biggest gaps — if desirability is strong but viability is blank, go there
- Ask 2-3 questions, pause, reflect back
- Update confidence score after each mini-round
- Move to research when enough context to search effectively (usually ~8 questions total)
- Never more than 15 minutes of questions before research starts
- Research is conditional: if the PM's own answers clearly indicate no real problem and no viable business (Desirability and Viability both at 1–2 with no countervailing signal), skip research and transition directly to findings with a plain explanation. Default: run research.

### 3. Research (loops)

ProveIt goes autonomous. PM waits. Delegates to a Sonnet subagent running three parallel tracks. **Minimum 3 searches per track, 9 searches total.** Do not write the findings summary until all three tracks are complete.

**Track 1: Competitor Landscape**
- Existing products (Product Hunt, app stores, SaaS directories)
- Open source alternatives (GitHub)
- Failed attempts — the graveyard (tarpit detection)
- Tools: `firecrawl_search`, `firecrawl_scrape`, `WebSearch`

**Track 2: Market Evidence**
- Real people expressing this pain (Reddit, HN, Twitter, forums)
- "I wish...", "I built...", "why isn't there..." patterns
- Industry articles about the problem space
- Evidence of switching behaviour
- Tools: `firecrawl_search`, `firecrawl_agent`, `WebSearch`

**Track 3: Viability Signals**
- Competitor pricing
- Market size estimates
- Adjacent market signals
- Investor activity (recent funding = validation)
- Tools: `firecrawl_search`, `firecrawl_extract`, `WebSearch`

Output writes to `research-N.md` (N = existing file count + 1). Never overwrites prior rounds.

**Output per competitor/finding:**
```
[Product Name]
What it does — 1-2 sentences
Overlap — High/Medium/Low
Gap — what's missing that your idea fills
Learn — patterns to steal
Status — Active/Dead/Funded/Free
```

### 4. Findings Review (loops)

Present structured summary with updated confidence scores:

```
Desirability: 6 → 8/10 (strong pain signals on Reddit, 3 active competitors = validated market)
Viability:    4 → 5/10 (competitors exist but only 1 charges, unclear willingness to pay)
Feasibility:  7/10     (no change — needs technical review)
```

**Kill Signals (flag clearly, don't decide for PM):**
- Tarpit detected — 5+ failed startups in this exact space
- Saturated market — 10+ active competitors, no clear gap
- Zero switching evidence — people complain but nobody changes
- No willingness to pay — competitors all free, no paid tier succeeds

Message: "Here's what the evidence shows. The bar for pursuing this just got higher. Here's what would need to be true for this to work despite these signals."

**What happens next — PM decides:**
- Scores high enough → offer Deep Dive, then outputs
- Gaps remain → ProveIt asks targeted follow-up questions, then researches again
- Kill signal → Present evidence honestly, offer Deep Dive to pressure-test it, PM decides
- PM has new info → Incorporate, re-score
- PM wants to stop → Everything saved, resume anytime

### 5. Deep Dive (optional — offered after every Findings Review)

After every findings review, ProveIt offers to go deeper. It reads the actual findings and identifies the sharpest unresolved question, then confirms with the PM before running.

**Deep Dive question:** Crafted by ProveIt (Opus) from real findings — not the raw idea. Examples:
- "Given Swagup dominates enterprise, is there a real SMB gap?"
- "Is the stated pain strong enough to drive switching, or is this a tarpit?"

**Menu-driven swarm composition (v3.0)** — between 5 and 7 parallel Sonnet agents, picked per idea profile. ProveIt states the chosen composition to the PM before spawning, so they can object.

| Agent | File | Mandate | Default? | Anchored by |
|-------|------|---------|----------|-------------|
| Market Bull | `swarm-N-market-bull.md` | Strongest case for opportunity | ✅ Always | Sean Ellis (PMF survey), Reid Hoffman (network effects), Brian Chesky (founder mode), Lenny (PMF benchmarks) |
| Market Bear | `swarm-N-market-bear.md` | Strongest case for failure | ✅ Always | Dalton Caldwell (tarpit, "just don't die"), Shreyas Doshi (anti-patterns), Marc Andreessen (market quality) |
| Customer Impact | `swarm-N-customer-impact.md` | Pure user perspective | ✅ Always | Bob Moesta (JTBD, switching forces), Teresa Torres (continuous discovery), Marty Cagan (discovery vs delivery), Ravi Mehta (ICP) |
| Technical Feasibility | `swarm-N-technical.md` | What's actually buildable | ✅ Always | Marty Cagan (feasibility as risk), Ravi Mehta (build vs buy) |
| Devil's Advocate | `swarm-N-devils-advocate.md` | Challenges conventional wisdom | ✅ Always | Annie Duke (thinking in bets), Shreyas Doshi (levels of strategy), Brian Chesky (push past experts), Marty Cagan (death by features) |
| GTM / Distribution | `swarm-N-gtm.md` | How does this get found and adopted? | 🔵 Conditional — consumer-facing, distribution-as-differentiator, weak "how would they find it?" | April Dunford (positioning), Brian Balfour / Elena Verna (growth loops), Bangaly Kaba (adjacent users), Kyle Poyar (PLG benchmarks) |
| Pricing / Monetisation | `swarm-N-pricing.md` | Pricing model, WTP, free-vs-paid line, unit economics | 🔵 Conditional — pricing uncertainty, Viability < 6, non-obvious price anchors | Madhavan Ramanujam (Monetizing Innovation, AI anchoring), Patrick Campbell (pricing data), Kyle Poyar (PLG monetisation) |

**When to add the conditional agents:**
- **GTM:** include if (a) consumer-facing, (b) discovery surfaced "how would they find it?" as weak, (c) competitive landscape is crowded and distribution is the differentiator. Skip for embedded internal tooling or captive audiences.
- **Pricing:** include if (a) PM is grappling with free vs paid, (b) pricing model affects core value prop, (c) Viability score below 6, (d) category has non-obvious price anchors. Skip for standard SaaS per-seat where pricing is well-understood.

Each agent receives the full `discovery.md` + latest `research-N.md` as context — arguing against real findings, not a blank slate. Each agent prompt embeds named frameworks plus suggested `mcp__lenny-transcripts__search_transcripts` queries so they pull current expert priors during research.

**Synthesis agent** then reads all 5 + prior research → writes `swarm-N-synthesis.md` with:
- Executive summary with confidence-weighted recommendation
- Direct contradictions between agents, with resolution
- Bias check (absolute claims, echo chambers, missing angles)
- Score impact (Desirability/Viability/Feasibility delta)
- Next steps

ProveIt (Opus) reads the synthesis and updates confidence scores in `discovery.md`.

**Round numbering:** N = existing swarm synthesis file count + 1. Never overwrites prior swarms.

### 6.5. Pre-Mortem & Kill Criteria (added v3.0, automatic after Cross-Model Review)

The cross-model review catches single-model bias. The pre-mortem catches **the founder's own bias** — the things they're not asking because they want the answer to be yes. This phase produces falsifiable kill criteria so the PM has a real stop condition, not just a wish-list of "things to validate".

**Anchored by:**
- **Annie Duke (Thinking in Bets / Quit)** — every "go" decision is a bet under uncertainty. Most people quit too late, not too early. Lenny's archive top-rates Annie for pre-mortem framing.
- **Shreyas Doshi** — pre-mortem framework, distinguishing inevitable failures (idea is wrong) from avoidable ones (execution would be).
- **Sean Ellis** — at least one kill criterion is the 40% "very disappointed" PMF threshold.
- **Marty Cagan** — death by features as the most common quiet failure mode.

**Output:** `pre-mortem-N.md` containing:
- The story of how it failed (12-month past-tense narrative)
- The 3 critical bets the PM is making, each with a falsification test, pass criteria, and a calendar kill date
- Failure modes ranked by likelihood × severity, with detection signals and Lenny references
- Kill criteria (operational stop conditions) + the inverse "we keep going if" list
- Confidence score impact

`pre-mortem-N.md` adds a new "Live bets" section to `discovery.md` that the PM can glance at any time to see what they're committing to monitor.

### 6 & 8. Cross-Model Review (OpenAI o3)

ProveIt sends its synthesis to OpenAI's o3 model for independent review. o3 checks for gaps, bias, logical leaps, and contradictions. Runs at two checkpoints:

- **Phase 6 (post-deep-dive):** Reviews `swarm-N-synthesis.md` + `discovery.md` after the Deep Dive, before scores are updated.
- **Phase 8 (pre-output):** Reviews all files before generating the Gamma deck. Fires even if the Deep Dive was skipped.

Results are shown transparently to the PM. CRITICAL findings are incorporated into scores. NOTABLE findings are presented for PM judgement.

**Script:** `scripts/openai-review.mjs` — reads markdown from stdin, sends to o3 with high reasoning effort, returns structured review.

**Prerequisite:** `OPENAI_API_KEY` environment variable. Gracefully skipped if not set.

**Output:** `review-N.md` files in the project directory (covered by `.gitignore`).

### 7. Brand Identity (optional, in-session)

If confidence scores are high enough, ProveIt offers to run the BrandIt flow in-session before generating the Gamma deck. This creates a complete brand identity — name, logo, colours, fonts, tone of voice, and design tokens — without leaving the ProveIt session. The PM gets 3 brand directions to choose from, with AI-generated logos via DALL-E. Output: `brand.md`, `brand-tokens.css`, `brand-tokens.json`, and logo PNGs. The Gamma deck then uses the real brand instead of placeholders.

Requires `~/brandit/scripts/generate-logo.mjs` for logo compositing. Gracefully degrades without `OPENAI_API_KEY` (skips logo generation).

### 9. Outputs (runs once, when ready)

The handoff is a bundle, not a single artefact. Different audiences need different things — the deck is for the leadership conversation, the spec is for the ticket queue, the playbook is for the PM's own next moves.

**1. Gamma Presentation (stakeholder / leadership deck)**

Generated via `mcp__claude_ai_Gamma__generate` with format: 'presentation'.

ProveIt reads `discovery.md`, all `research-*.md`, all `swarm-*-synthesis.md`, and the latest `pre-mortem-N.md` before generating.

Slides:
1. The Problem — who has it, how painful, evidence
2. Market Landscape — competitors, gaps, positioning
3. The Opportunity — what's different about this approach
4. Target User — persona, JTBD, current workaround
5. Business Model — how money works, market size
6. What to Build — high-level concept (NOT technical spec)
7. Size & Complexity — T-shirt size, key technical risks
8. Remaining Unknowns + Live Bets — what still needs validation, kill criteria from pre-mortem
9. Recommended Next Steps — validation playbook summary

**2. Validation Playbook (written to discovery.md)**

Practical experiments tied to remaining unknowns:
- "Viability is 7/10 — run a landing page test with pricing to test willingness to pay"
- "Desirability is 8/10 but forum-based — do 5 user interviews to confirm"
- "Feasibility is 6/10 — get a technical spike on the real-time sync before committing"

**3. PRD / Tech Spec (`spec.md`) — added v3.0**

Engineers don't read decks. The spec is the format that drops cleanly into Linear, Jira, or Notion. Generated alongside the Gamma deck, structured for ticketing:

- Problem statement (from brain dump + discovery)
- Target user + JTBD + today's workaround + switching trigger
- Success metrics (pulled directly from kill criteria in `pre-mortem-N.md` so the team's leading indicators are the same conditions the PM committed to monitor)
- Functional requirements with acceptance criteria, IDs ready for ticketing
- Non-functional requirements (security, performance, accessibility, reliability)
- Out of scope (deliberate, prevents scope creep)
- Open questions and assumptions (cross-referenced with Live Bets section in `discovery.md`)
- T-shirt size and technical risks (from Technical Feasibility swarm agent)
- References back to all source docs

### 10. Next Steps

ProveIt presents a clean closing with multiple parallel handoff paths:

- **Build it** — run `/orchestrate` to kick off a full ShipIt build. It reads `discovery.md`, `brand.md`, and `spec.md` for context.
- **Hand to engineering directly** — `spec.md` drops into Linear/Jira/Notion. Deck is for leadership.
- **Hand to design (claude.ai/design canvas)** — added v3.0 — manual handoff: drop `discovery.md` + `brand.md` into a fresh Claude design-canvas chat to get UX flows and wireframes that respect the validation work.
- **Share the deck** — Gamma presentation ready for stakeholders.
- **Keep validating** — loop back if confidence isn't high enough yet.

This is a handoff, not an invocation — downstream tools run in their own sessions.

---

## File Structure

ProveIt writes separate files per research phase. `discovery.md` is the index — it stays lightweight throughout.

```
[project-dir]/
├── discovery.md              # Index: scores, brain dump, Q&A, Live Bets, file references
├── research-1.md             # Standard research round 1
├── research-2.md             # Standard research round 2 (if looped)
├── swarm-1-market-bull.md    # Default swarm agents
├── swarm-1-market-bear.md
├── swarm-1-customer-impact.md
├── swarm-1-technical.md
├── swarm-1-devils-advocate.md
├── swarm-1-gtm.md            # Conditional — added when GTM matters (v3.0)
├── swarm-1-pricing.md        # Conditional — added when pricing matters (v3.0)
├── swarm-1-synthesis.md      # Main swarm deliverable
├── pre-mortem-1.md           # Pre-mortem & kill criteria (v3.0, Phase 6.5)
├── review-1.md               # Cross-model review (o3)
├── brand.md                  # Brand assets (if BrandIt phase ran)
└── spec.md                   # PRD / tech spec for engineering handoff (v3.0)
```

All files are standalone markdown — shareable, pasteable, no dependencies. None are committed to git (covered by `.gitignore`).

### discovery.md template

```markdown
# ProveIt: [Idea Name]
Generated: [date]
Last updated: [date]

## Confidence Score
Desirability: X/10 | Viability: X/10 | Feasibility: X/10
Status: [Researching / Needs more discovery / Ready for handoff / Kill signal]

## Idea (Brain Dump)
[Raw capture from Brain Dump]

## Discovery
### Desirability
- Target user: ...
- Current workaround: ...
- Pain level: ...
- Who they'd fire: ...
- Distribution: ...

### Viability
- Willingness to pay: ...
- Business model: ...
- Market size (gut): ...
- Biggest business risk: ...

### Feasibility
- Key integrations: ...
- Real-time needs: ...
- T-shirt size: ...

## Research Files
- research-1.md — [one-line summary] ([date])
- swarm-1-synthesis.md — Deep dive: [question] ([date])

## Kill Signals
[Any triggered, with evidence. Or "None detected."]

## Recommendation
[Go / Kill / Pivot — with reasoning]

## Validation Playbook
- [ ] [Experiment 1 — what it tests, how to run it]
- [ ] [Experiment 2]

## Gamma Deck
[Link to generated presentation, or "Not yet generated"]
```

**Session resume:** ProveIt's first move in any session is to check if `discovery.md` exists. If yes, read it, Glob for `research-*.md` and `swarm-*-synthesis.md`, summarise where things stand, and ask what the PM wants to tackle next.

---

## Model Strategy

| Phase | Model | Why |
|-------|-------|-----|
| Brain Dump | Opus | Reads between the lines, catches what PM isn't saying |
| Discovery | Opus | Confidence scoring requires judgement |
| Research | Sonnet (subagent) | Heavy tool use, structured output, speed |
| Findings Review | Opus | Synthesising messy research into clear signal |
| Deep Dive question crafting | Opus | Identifying the sharpest gap from real findings |
| 5–7 Deep Dive agents (menu-driven) | Sonnet (parallel subagents) | Parallel, cost-efficient, tool-heavy. GTM and Pricing agents added conditionally. |
| Deep Dive Synthesis | Sonnet (subagent) | Reads and resolves the swarm output |
| Pre-Mortem & Kill Criteria | Opus | Judgement-heavy — surfacing founder bias, falsification design, calendar kill dates |
| Gamma Deck | Sonnet (subagent) | Structured output from synthesised content |
| Validation Playbook | Opus | Creative + strategic, connecting gaps to experiments |
| spec.md PRD generation | Opus | Translating synthesis into engineering-ready structure |
| Brand Identity (brief) | Opus | Creative judgement, reading PM intent |
| Brand Identity (directions) | Sonnet (3 parallel subagents) | Parallel, structured output |
| Brand Identity (logos) | DALL-E (OpenAI) | Image generation |
| Next Steps | Opus | Simple — presenting options |

Single ProveIt agent runs on Opus. All subagents explicitly use `model: "sonnet"`.

---

## Plugin Structure

```
proveit/
├── .claude-plugin/
│   ├── plugin.json          # Plugin manifest
│   └── marketplace.json     # Local marketplace config
├── agents/
│   └── proveit.md           # Main ProveIt agent (Opus)
├── commands/
│   ├── proveit.md           # /proveit skill — entry point
│   ├── proveit-fast.md      # /proveit-fast — quick assumption check
│   ├── proveit-dashboard.md # /proveit:dashboard — portfolio comparison
│   └── proveit-retro.md     # /proveit:retro — calibration retrospective
├── docs/
│   └── design.md            # This file
├── .claude/
│   └── settings.json        # Permissions config (Bash disabled by default)
├── scripts/
│   └── openai-review.mjs     # Cross-model review via OpenAI o3
├── package.json               # Dependencies (openai)
├── .gitignore               # Excludes all generated research files
├── setup.sh                 # Automated installation
├── README.md                # User-facing docs
└── CLAUDE.md                # Agent instructions
```

---

## MCP Tools Required

| Tool | Used For |
|------|----------|
| `WebSearch` | Quick market searches, trend discovery |
| `WebFetch` | Fallback for page content |
| `firecrawl_search` | Deep web search with scraped results |
| `firecrawl_scrape` | Competitor site analysis |
| `firecrawl_agent` | Autonomous multi-source research |
| `mcp__claude_ai_Gamma__generate` | Final presentation output |
| `mcp__lenny-transcripts__search_transcripts` | Search 284 episodes of Lenny's Podcast for current PM expert priors (added v3.0) |
| `mcp__lenny-transcripts__get_episode` | Pull full transcript for a specific guest (added v3.0) |
| `mcp__lenny-transcripts__list_episodes` | List all available episodes / guests (added v3.0) |
| `openai` (npm) | Cross-model review — independent bias/gap check via o3 |

Firecrawl, Gamma, Lenny, and OpenAI are all optional — ProveIt degrades gracefully without them. Install Lenny via `claude mcp add -t http -s user lenny-transcripts https://lenny-mcp.onrender.com/mcp`. Source: [akshayvkt/lenny-mcp](https://github.com/akshayvkt/lenny-mcp).

---

## Setup / Onboarding

```bash
git clone https://github.com/cla1redonald/proveit.git ~/proveit
cd ~/proveit
./setup.sh
```

`setup.sh`:
1. Checks prerequisites (claude, node, jq)
2. Merges plugin config into `~/.claude/settings.json`
3. Verifies installation
4. Prints quick-start instructions

To uninstall: `./setup.sh --uninstall`

---

## What This Is NOT

- Not a project management tool
- Not a technical architecture tool (that's ShipIt)
- Not a UX/visual design tool (it hands off to the claude.ai design canvas; design specifics live there)
- Not a replacement for talking to real users
- Not a decision-maker — it presents evidence, the PM decides

(Note v3.0: ProveIt *now* produces a structured PRD as Output 3 — `spec.md` — so the prior "not a PRD generator" exclusion has been retired. The spec is intentionally lightweight for ticketing, not a substitute for product discipline.)

---

## Scope

**In:**
- Single-user (one PM, one idea per session)
- Core discovery loop (now 11 named phases including Phase 6.5 Pre-Mortem)
- Optional Deep Dive (Phase 5) with menu-driven swarm composition (5–7 agents)
- Separate file per research phase
- `discovery.md` as persistent index, with Live Bets section from pre-mortem
- Triple-output handoff: Gamma deck (stakeholder) + spec.md (engineering) + validation playbook (PM)
- Optional brand identity (Phase 7) and design canvas handoff (Phase 10)
- Confidence scoring and kill signal detection
- Falsifiable kill criteria with calendar dates (Phase 6.5)
- Cross-model review via o3 at two checkpoints
- Lenny's Podcast MCP integration for current PM expert context across all phases
- Session resume
- Shareable — no hardcoded paths, no Obsidian dependency
- Portfolio dashboard (/proveit:dashboard)
- Calibration retro (/proveit:retro)
- Research steering

**Out:**
- Multi-user collaboration
- Web UI (the standalone proveit-web app is a separate codebase, not the plugin)
- Database persistence
- Custom frameworks beyond the embedded set (the question set + named expert frameworks are hardcoded)
- Direct integration write-back to Notion/Linear/Jira (the spec.md is structured to drop in manually)
- Design generation (handoff to claude.ai/design canvas)
