## 9. Outputs (runs once, when ready)

### Output 1: Gamma Presentation

Generate a technical handoff deck using the Gamma MCP tool. Use `mcp__claude_ai_Gamma__generate` with format `presentation`.

Before generating, read:
- `discovery.md` (scores, brain dump, discovery Q&A)
- All `research-*.md` files (competitor landscape, market evidence)
- All `swarm-*-synthesis.md` files (deep-dive findings, if any)
- `brand.md` (if it exists — use brand name, colours, logo in the deck)

**Slide structure:**

1. **The Problem** — Who has it, how painful, evidence from research
2. **Market Landscape** — Competitors, gaps, positioning map
3. **The Opportunity** — What's different about this approach
4. **Target User** — Persona, jobs-to-be-done, current workaround
5. **Business Model** — How money works, market size estimate
6. **What to Build** — High-level concept (NOT a technical spec)
7. **Size and Complexity** — T-shirt size, key technical risks and unknowns
8. **Remaining Unknowns** — What still needs validation
9. **Recommended Next Steps** — Validation experiments + technical exploration needed

**Footer convention — required on every slide:**

Add to the Gamma generation prompt: `Add a small footer to every slide reading "Generated with ProveIt · proveit.tools" — make "proveit.tools" a clickable link. Use the brand's secondary text colour (fall back to neutral grey #6b7280 if no brand token is defined), ~10pt, bottom centre.`

To maximise the chance Gamma honours the instruction, put the footer requirement on the FIRST line of the generation prompt rather than buried in the slide structure.

**Verification:** after generation, use `mcp__claude_ai_Gamma__read_gamma` with the returned deck ID to fetch its content and confirm the string "Generated with ProveIt" appears across the slides. If absent, regenerate the deck with even stronger footer emphasis — the Gamma MCP is generate-only, so post-generation editing is not available; a fresh generation with a tighter prompt is the only correction path.

### Output 2: Validation Playbook

Write to `discovery.md` (Validation Playbook section). Practical experiments tied to remaining unknowns:

For each score below 8, suggest 1-2 specific experiments:
- Quick prototypes (landing page, Figma prototype, wizard-of-oz test)
- User research (5 interviews with target users, specific questions to ask)
- Market tests (pricing page test, waitlist, pre-sale)
- Technical spikes (proof of concept for the hardest technical unknown)

Each experiment should state: what it tests, how to run it, what "pass" looks like.

### Output 3: PRD / Tech Spec (`spec.md`)

Engineers don't read decks. The Gamma deck is for the leadership / stakeholder conversation; the spec is for the team that has to build it. Write `spec.md` to the working directory in a format that drops cleanly into Linear, Jira, or Notion.

Required structure for `spec.md`:

```markdown
# Spec: [Idea Name]
Generated: [date] from ProveIt validation
Confidence at handoff: D[X]/V[X]/F[X]
Brand: [brand name from brand.md if it exists, else "TBD"]

## Problem statement

[2-3 sentences from the brain dump and discovery — what problem this solves, for whom, in concrete terms. No jargon, no buzzwords.]

## Target user

- **Primary persona:** [from discovery — who specifically]
- **Job to be done:** [from discovery — JTBD framing]
- **Today's workaround:** [what they currently do — the real competitor]
- **Switching trigger:** [what would make them actually try this — from discovery and research]

## Success metrics

[3-5 measurable outcomes. These are the metrics the engineering team should instrument from day one. Pull these from the kill criteria in `pre-mortem-[N].md` — the "we keep going if" list — so they double as the team's leading indicators.]

| Metric | How measured | Target by [timeframe] |
|---|---|---|
| [metric] | [instrumentation source] | [target value] |

## Functional requirements

[The MVP feature list. Each requirement has an ID for ticketing. Group by user-facing function, not technical layer.]

### F1. [User-facing function]
- **What:** [the user-visible behaviour]
- **Why:** [link back to which problem statement element this addresses]
- **Acceptance:** [3-5 bullet test conditions an engineer can verify]

### F2. ...

## Non-functional requirements

[Cross-cutting concerns. Always include security, performance, accessibility, and reliability. Pull specifics from the technical feasibility swarm agent's output.]

- **Security:** [auth model, data classification, threat surface]
- **Performance:** [target latency, load profile]
- **Accessibility:** [WCAG level target, keyboard / screen reader requirements]
- **Reliability:** [uptime target, failure modes documented in pre-mortem]

## Out of scope

[What this spec deliberately does NOT cover. This is the most important section to prevent scope creep — be explicit about second-order features the team might assume are included. Reference the validation playbook for what to test before adding any of these later.]

## Open questions and assumptions

[Things the team needs to resolve during build, with the assumption being made today. Each item references the Live Bets section of `discovery.md` where applicable, so the team can see which questions are also strategic kill-criteria.]

| Question | Current assumption | Owner to resolve | By when |
|---|---|---|---|

## T-shirt size and technical risks

[From the technical feasibility swarm agent and the discovery's feasibility questions. T-shirt size: XS / S / M / L / XL. Top 3 technical unknowns with mitigation approach.]

## References

- `discovery.md` — full discovery and confidence reasoning
- `pre-mortem-[N].md` — failure scenarios and kill criteria
- `research-N.md`, `swarm-N-synthesis.md`, `review-N.md` — supporting research
- `brand.md` — brand identity and design tokens (if BrandIt phase ran)
```

The spec is *not* a re-summary of the Gamma deck. It is a complement: where the deck is for the conversation, the spec is for the ticket queue. Don't repeat the marketing narrative — pull only what an engineer needs to size, scope, and start.

### Output 4: Design Brief (`design-brief.md`)

Engineers get `spec.md`. Stakeholders get the Gamma deck. Designers — and any other tool that wants to compose visual artefacts (Claude Design, Figma, a contract designer) — get `design-brief.md`. It is the synthesis a designer can read on its own without first absorbing all of `discovery.md`.

The brief is **portable**, not Claude-Design-specific. It is the document a PM can also paste into a designer's Slack DM, attach to a Linear ticket, or drop into Figma's project description.

Before generating, read:
- `discovery.md` (target user, the one specific moment that matters, voice cues from research quotes)
- `brand.md` (or `brand-extension.md` / inherited assets — the canonical brand pointer)
- `spec.md` (functional requirements anchor the artefact list)
- `pre-mortem-[N].md` (kill criteria become design success criteria; bets become "don't do this")

Required structure for `design-brief.md`:

```markdown
# Design Brief: [Idea Name]
Generated: [date] from ProveIt validation
Confidence at handoff: D[X]/V[X]/F[X]
Brand: [brand name from brand.md if it exists, else "TBD"]

## What we're designing for

[2-3 sentences. The validated idea, in the voice of the brief — not the validation. Pulled from Brain Dump and discovery, but written outward-facing for a designer who wasn't in the room. Avoid ProveIt jargon ("D/V/F scores", "kill criteria") — translate to plain language.]

## The hero scenario

[ONE specific user, ONE specific moment, what they want.

Not a persona. A scene. Example: "It's Monday morning. Maya, an EM at a 40-engineer infra team, opens her laptop. She has 18 minutes before her first 1:1. She wants to know what her team shipped over the weekend, who's stuck, and what she should ask about today — without scrolling through 8 Slack channels."

If the discovery wasn't specific enough about a moment, ask the PM one focused question to add a moment now: "What's the specific 30-second window we're trying to serve? Who, where, on what device, what just happened, what do they want?" Then write the scene.]

## Three contexts that matter

[The 2-4 user states or moments the design has to handle. Not a feature list — moments. Each one names: the user state, the system state, what the user is trying to do.

1. **First-day empty state** — no signal yet, system has nothing to show, user wonders if it's working.
2. **Populated digest** — system has signal, user is scanning for what's important.
3. **Blocker detected** — system surfaces something urgent, user needs to act on it.

Pull from discovery + spec functional requirements. These are the states Claude Design (or a designer) will produce wireframes for.]

## Voice and tone

[Pulled from `brand.md` (or inherited assets). Three things:
- 2-3 voice adjectives (e.g. "confident, direct, no-marketing-speak")
- 1-2 example sentences in voice ("Standup updates write themselves" not "Empower your team to elevate their async workflow")
- 1 anti-pattern ("no AI hedging — never start with 'It seems' or 'You might want to'")]

## Brand reference

[Pointer (not duplication) to `brand.md` / `brand-extension.md` / inherited assets. The brief states which file is canonical and lists the 5–6 tokens any single artefact most needs:
- Primary colour: `#…`
- Neutral background: `#…`
- Heading font: …
- Body font: …
- Mono / data font (if specified): …
- Logo: see `brand.md` § Logo (or describe how to use it inline if logo isn't yet locked)

For PMs handing off to claude.ai/design specifically: "save these tokens once as a Design System on claude.ai/design (Design systems tab, top-level on the home page) — every subsequent project on the canvas can pull from it."]

## What NOT to do

[The brand-safety + scope guardrails. Pulled from discovery (out-of-scope), pre-mortem (don't-do-this-or-it-fails), and brand:
- Don't recreate competitor UI in mockups (e.g. "no Slack-branded UI; reference by name only")
- Don't drift from the brand palette to add accent colours unprompted
- Don't add features beyond `spec.md` § Functional requirements
- Don't soften the voice — "confident and direct" is a structural lever, not decoration]

## Success criteria for any artefact

[3-4 bullets. Pulled from `pre-mortem-[N].md` kill criteria + spec success metrics, translated into design-evaluable language:
- A stakeholder can follow the narrative on slide titles alone (for decks)
- A new [primary persona] can complete onboarding in under [N] minutes (for wireframes)
- Specifically named numbers and entities ([23 min/day, 47 engineers, the customer name]) appear, not invented placeholders
- Layout reads at back-of-the-room scale — no <14pt body type on a deck slide]

## Artefacts the PM might want

[Cross-reference to the prompts file:
- 9-slide stakeholder pitch deck → see `claude-design-prompts.md` § "Stakeholder pitch deck"
- Home + onboarding wireframes (mobile + desktop, all states) → see § "Wireframes"
- Logo concept exploration → see § "Logos"
- Social cards / one-pagers → see § "Social cards"]

## References

- `discovery.md` — full validation evidence and confidence reasoning
- `brand.md` — full brand system (this brief is the abridged version for designers)
- `spec.md` — engineering PRD; functional requirements anchor the artefact list above
- `pre-mortem-[N].md` — what failure looks like; informs what NOT to do
```

For `contextType: existing` sessions, "What we're designing for" frames the change, not the product as a whole. The hero scenario is the moment the *new* thing affects, not the user's first encounter with the existing product.

### Output 5: Claude Design Prompts (`claude-design-prompts.md`)

A small library of paste-ready prompts the PM drops straight into the prompt box on claude.ai/design. Each prompt is fully populated with the PM's evidence, brand, voice, and "don't do this" constraints — no template syntax, no `[brackets]`, no follow-up needed.

> **Bracket resolution contract.** Before writing this file, ProveIt resolves every `[bracketed slot]` from the PM's actual `discovery.md`, `brand.md` (or `## Inherited assets` / `brand-extension.md` for `contextType: existing` sessions), `spec.md`, and `pre-mortem-[N].md`. The PM only ever sees the resolved file. An unresolved slot leaking into a paste-ready prompt is a defect — the PM would paste `[Idea Name]` literally into Claude Design.

Why this matters: Claude Design produces dramatically better artefacts when the prompt carries specifics. Vague prompts produce plausible-but-invented numbers and bland headers. Specific prompts produce data-dense layouts with the PM's real evidence, mock UIs with named characters, and copy that holds the brand voice across every slide.

Before generating, read:
- `discovery.md` (statistics, named competitors, named target user, hero moment)
- `brand.md` / inherited assets (colour, type, voice, what-not-to-do)
- `spec.md` (functional requirements — the screen list and state list for wireframes)
- `pre-mortem-[N].md` (kill criteria — the success-metrics anchor for the deck and for the social cards)

Required structure for `claude-design-prompts.md`:

```markdown
# Claude Design Prompts: [Idea Name]
Generated: [date] from ProveIt validation
For: claude.ai/design — paste any of these as the prompt for a new project on the canvas

## How to use this file

1. Open [claude.ai/design](https://claude.ai/design)
2. Pick the project type matching the artefact you want (Slide deck / Prototype: Wireframe / Other)
3. Name the project, hit Create
4. Copy the prompt below for that artefact, paste into the prompt box, send
5. (Optional but recommended) Set up the brand once as a Design System (top-level "Design systems" tab on the home page) — then it's available to every future project without re-pasting

---

## 1. Stakeholder pitch deck (9 slides)

**Use it when:** You need to make the case for [funding / building / partnering] to a leadership audience.
**Mode in claude.ai/design:** Slide deck
**Build time:** ~7-10 minutes

```text
Make a 9-slide stakeholder pitch deck for [Idea Name] — [one-line description from brain dump].

The audience is [audience from discovery — e.g. "the leadership team at a [company type], evaluating whether to fund this build"]. 15 minutes.

Include slides for: problem, target user, evidence, solution, market, business model, competitive landscape, build plan, asks.

Use these specifics from the validation evidence (don't invent placeholders):
- [pull 5-7 key statistics/quotes from discovery + research, e.g. "47 engineers surveyed, 82% rate daily standup as low-value to themselves"]
- [the kill criteria from pre-mortem-N.md as the success-metrics anchor]
- [the named competitors from research-N.md, not "industry incumbents"]

Use these brand tokens (apply consistently to every slide):
- Primary colour: [from brand.md]
- Neutral background: [from brand.md]
- Heading font: [from brand.md]
- Body font: [from brand.md]
- Voice: [from brand.md voice adjectives + don't-do anti-patterns]

I want to test brand consistency, so use these exact tokens for every slide and don't substitute alternatives. Don't recreate competitor UI; reference them by name only. Don't add a teal/blue accent unprompted — the model will introduce one if not constrained.
```

---

## 2. Wireframes — home + onboarding, mobile + desktop, all states

**Use it when:** You need to test the user flow with a few real users, or hand a designer a starting point.
**Mode in claude.ai/design:** Prototype → Wireframe
**Build time:** ~5-7 minutes
**Important:** the Wireframe mode wants to interview you first. The prompt below explicitly skips this — without that line, you'll get a question instead of wireframes.

```text
Wireframe the [home and onboarding screens / specific flow] for [Idea Name] — [one-line description].

The home screen is what [primary persona] sees [hero scenario from design-brief.md]: [what they're scanning for].

The onboarding flow is what [secondary persona — e.g. "a new team admin"] goes through to [the setup task].

Show both mobile and desktop layouts.

Show key interaction states: empty state ([first-time, no signal]), loading, populated, and a "[critical event]" alert state.

Use this brand:
- Primary: [from brand.md]
- Neutral background: [from brand.md]
- Headings: [from brand.md]
- Body: [from brand.md]

Use specific mock content, not lorem ipsum. Real-sounding names, real-sounding stats from the validation, real-sounding entity references — pulled from `discovery.md` where possible.

Skip the interview — proceed directly to wireframes.
```

---

## 3. Logo concepts — three directions

**Use it when:** Brand has a name but no logo yet, or you want to revisit the logo direction.
**Mode in claude.ai/design:** Other (freeform)
**Build time:** ~3 minutes
**Note:** This is the one place Claude Design overlaps BrandIt. Use Claude Design when you want three *directions* with rationale; use BrandIt when you want a complete brand system in one shot. They compose.

```text
Three logo concepts for "[Brand Name]" — [one-line product description].

For each direction, show:
1. The wordmark (the text "[Brand Name]" set in a chosen typeface)
2. The symbol mark (an icon that could stand alone)
3. The lockup (wordmark + symbol together)

Three distinct directions:
- Direction A — [tone 1, from brand voice]: [palette + typography hint]
- Direction B — [tone 2]: [hint]
- Direction C — [tone 3]: [hint]

Lay them out side by side at consistent sizes. Show each direction at three sizes (favicon 16px, app icon 64px, hero 256px) so I can judge legibility. Use [neutral background from brand.md].

Add a short rationale paragraph for each direction explaining the design choice in product terms — what the symbol means, what behaviour it could animate, how it reads at small sizes.
```

---

## 4. Social cards / one-pagers — N stats on a 2×3 grid

**Use it when:** You want shareable assets for posting validation evidence (social, internal, sales).
**Mode in claude.ai/design:** Other (freeform)
**Build time:** ~3 minutes

```text
Generate a set of [N] social media share cards (LinkedIn / X format, 1200×630) for [Idea Name] — [one-line description].

Each card communicates a single key statistic from the validation, paired with a one-line interpretive headline. Use these stats (don't invent placeholders):

1. "[stat from discovery + headline]"
2. "[stat from research + headline]"
... (one per stat the PM wants to surface)

Brand:
- [tokens from brand.md]

Lay all [N] cards on one canvas in a 2×3 grid. Each card: small wordmark in corner, the big stat dominates the layout, the one-line headline reads as quiet support underneath, a footer line with the source/methodology context. Voice: [from brand.md].
```

---

## Boundary reminder

Each prompt above is tuned for one artefact in one mode. Don't ask the deck mode to also generate logos. Don't ask the wireframe mode to also draft marketing copy. Probes consistently showed that one artefact per project gives the best output — keep them on separate canvases.
```

For `contextType: existing` sessions, brand tokens come from `## Inherited assets` (or `brand-extension.md`), not `brand.md`. Read whichever is canonical before resolving the brand slots in each prompt — the PM should never see "[from brand.md]" leak through when their session is an iteration on an existing brand.

---

## 10. Next Steps

After presenting the Gamma deck, validation playbook, and spec, present a clean closing. The three downstream tools (BrandIt, Claude Design, Gamma) and the build path (`/orchestrate`) each produce different artefacts — make the choices visible.

### The handoff bundle (already in this directory)

| Artefact | Audience | Use it for |
|----------|----------|------------|
| Gamma deck | Stakeholders, leadership, funders | The narrative conversation. 9 slides. |
| `spec.md` | Engineering | Drops into Linear/Jira/Notion as a real PRD. Success metrics tied to kill criteria. |
| `discovery.md` (with Live Bets section) | The PM (you) | The glanceable status of bets, kill dates, scores. Comes back to this between phases. |
| `brand.md` (or `brand-extension.md`, or `## Inherited assets`) | Design + marketing | Brand system tokens for downstream design + engineering work. |
| `pre-mortem-N.md` | The PM, stakeholders | The 3 critical bets and explicit kill criteria. |
| `scenarios-N.md` (if Wave 3 ran) | The PM | 3 future scenarios + paste-ready experiment artefacts. |
| `design-brief.md` | Designers, Claude Design canvas, Figma, contract designers | Synthesis a designer can read on its own. Hero scenario, voice, brand pointer, what-not-to-do. |
| `claude-design-prompts.md` | The PM (operational input for claude.ai/design) | Four paste-ready prompts: deck, wireframes, logos, social cards. Each pre-populated with the PM's evidence and brand. |

### Suggested closing message

> "Your idea is validated and ready for handoff. Here's what's saved and what to do with it.
>
> **The bundle in this directory:**
> - `discovery.md` — your full validation, scores, kill criteria. Comes back to this between phases.
> - `pre-mortem-[N].md` — the 3 critical bets and explicit kill dates.
> - `spec.md` — engineering PRD. Drops cleanly into Linear / Jira / Notion.
> - `brand.md` (or inherited assets) — the brand system tokens.
> - `design-brief.md` — the synthesis a designer or stakeholder can read on its own.
> - `claude-design-prompts.md` — paste-ready prompts for claude.ai/design.
> - Gamma deck — the stakeholder narrative, ready to share.
>
> **Paths from here:**
>
> - **Build it** — run `/orchestrate` in this directory. It reads `discovery.md`, `brand.md`, and `spec.md` as context.
> - **Hand to engineering** — `spec.md` drops into your ticket queue.
> - **Hand to design** — open [claude.ai/design](https://claude.ai/design), drop your `brand.md` tokens into a Design System once (top-level "Design systems" tab — set up once, reuse across projects), and paste any prompt from `claude-design-prompts.md` to generate a deck, wireframes, logos, or social cards. When you want validation on a *new* direction, hit **Handoff to Claude Code** in any design's Share menu and run `/proveit` against it — the round-trip works.
> - **Share the deck** — the Gamma presentation is ready for the stakeholder conversation.
> - **Run the cheapest experiment first** — if Wave 3 ran, `scenarios-[N].md` has the prioritised experiment list with paste-ready artefacts.
> - **Keep validating** — if any score wants more depth, we can loop back.
>
> Everything's saved. Come back anytime."

### Boundary reminder

These three downstream tools have **non-overlapping** outputs (with one nuance — see logo overlap below). The Phase 7 boundary table applies here too:

| Tool | Produces | Does NOT produce |
|------|----------|------------------|
| BrandIt | Full brand system: name, tagline, palette, typography pairing, design tokens (CSS + JSON), voice, logo PNG | UX, wireframes, screens, marketing copy beyond tagline |
| Claude Design | Decks, wireframes, screens, social cards, logos as exploratory directions, any 2D layout. Reads BrandIt tokens or a saved Design System. | Brand system (no token export), engineering spec, marketing copy beyond what's in an artefact |
| Gamma | Stakeholder deck (the validation narrative) | UX, wireframes, engineering spec, brand identity |

**Logo overlap nuance.** BrandIt produces *one* finished logo as part of a complete brand system. Claude Design produces *three exploratory directions* with rationale, in vector/HTML, in ~3 minutes — useful when the PM wants to choose between approaches before committing. They compose: run BrandIt for the brand system; if the PM wants to A/B the logo direction before locking it, the "Logos" prompt in `claude-design-prompts.md` is the way.

Don't ask Claude Design to also pick a colour palette. Don't ask Gamma to generate wireframes. Don't ask BrandIt to draft an ad. Each tool is at its strongest in its own lane.

This is a handoff, not an invocation. ProveIt's job is done at this point — the PM decides what happens next.

---
