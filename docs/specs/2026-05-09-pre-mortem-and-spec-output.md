# Spec: Pre-Mortem Phase + spec.md PRD Output

> **Historical note (2026-07-09):** The BrandIt / Brand Identity phase referenced in this document was removed from ProveIt in v3.8.0 (phases renumbered; no brand outputs) — see the `docs/design.md` changelog. Kept as a historical record; do not implement from it.


**Date:** 2026-05-09
**Status:** Implemented (commits `81ae8c9`, `a1728b4`)
**Related plan:** [`docs/plans/2026-05-09-agent-maturation.md`](../plans/2026-05-09-agent-maturation.md)

## Goals

1. Insert a deliberate **falsification + kill-criteria** stage between research synthesis and outputs — the missing decision-support moment in the pre-existing pipeline.
2. Produce a structured **PRD output** alongside the Gamma deck so engineering doesn't have to translate slides into tickets.
3. Make the swarm composition **menu-driven** — default 5, with GTM and Pricing agents added when the idea profile warrants.
4. Embed **named PM expert frameworks** as durable structure in every agent prompt; integrate the [`lenny-mcp`](https://github.com/akshayvkt/lenny-mcp) for runtime expert priors.

## Phase 6.5: Pre-Mortem & Kill Criteria

**When it runs:** Automatic, after Cross-Model Review (Phase 6) completes. Before BrandIt (Phase 7).

**Frameworks anchoring this phase:**
- **Annie Duke** — Thinking in Bets, Quit. Falsification + kill-when-to-quit logic.
- **Shreyas Doshi** — Pre-mortem framework; inevitable vs avoidable failures.
- **Sean Ellis** — PMF survey 40% threshold as a kill criterion.
- **Marty Cagan** — Death by features as the most common quiet failure.

**Frame to PM:**
> "Now I want to spend 10 minutes on the pre-mortem. Imagine it's 12 months from now and this idea is dead. What killed it? I'll write the failure scenarios out, then turn each one into a falsification test you can actually run — with a date by which you'd kill the idea if the test fails."

**Steps:**

1. **Determine round number N** — Glob for `pre-mortem-*.md`; N = count + 1.
2. **Synthesise from existing context** — Read `discovery.md`, latest `research-*.md`, latest `swarm-*-synthesis.md`, latest `review-*.md`. Use `mcp__lenny-transcripts__search_transcripts` for category-specific failure-mode patterns.
3. **Write `pre-mortem-N.md`** with the structure below.
4. **Present to PM** — read out the 3 critical bets and kill criteria explicitly. Ask: "These are the things you're betting on. Are any wrong, missing, or framed badly?" Update file from PM corrections.
5. **Update `discovery.md`** — add a top-level "## Live bets" section containing the 3 critical bets with their kill dates. Add to Research Files section. If pre-mortem changes scores, note them with `Adjusted post-pre-mortem: [reason]`.

**Required structure for `pre-mortem-N.md`:**

```markdown
# Pre-Mortem [N]: [Idea Name]
Date: [date]

## The story of how this failed

[2-3 paragraph narrative: imagine it's 12 months from now and this is dead. Tell the story of what happened — past tense. Be specific. Reference market dynamics, competitor moves, and user behaviour patterns from research and swarm.]

## The 3 critical bets you are making by proceeding

For each bet:
- **Bet:** [the assumption underneath]
- **Why it's load-bearing:** [what depends on it being true]
- **Falsification test:** [a specific, runnable experiment that would prove it wrong]
- **Pass criteria:** [what would need to be true to count as 'still alive']
- **Kill date:** [calendar date by which the test must produce a result]

[Exactly 3 — pick the highest-leverage, not all possible ones]

## Failure modes ranked

| # | Failure mode | Likelihood | Severity | Detectable by |
|---|---|---|---|---|

[3-5 modes. Cite Lenny guests where they've seen the failure mode before — e.g. "Shreyas Doshi described this exact dynamic on episode XYZ".]

## Kill criteria

- "If [metric] is below [threshold] by [date], kill."
- "If [signal] appears within [window], kill."

[3-5 kill criteria — non-overlapping with falsification tests above. These are the *operational* stop conditions; bet tests are *strategic*.]

## What would need to be true to keep going

[Inverse of kill criteria. "We keep going if:" list. The explicit list of things the PM commits to monitor.]

## Confidence after pre-mortem

| Score | Before | After | Why |
|---|---|---|---|
```

## Output 3: `spec.md` — PRD for engineering handoff

**When it runs:** Phase 9 (Outputs), alongside Output 1 (Gamma deck) and Output 2 (Validation Playbook).

**Why this is separate from the deck:** Engineers don't read decks. The Gamma deck is for the leadership / stakeholder conversation; the spec is for the ticket queue. Different artefact, different audience.

**Format:** Markdown structured to drop cleanly into Linear, Jira, or Notion. The structure mirrors typical PRD templates so engineering teams don't have to reformat.

**Required structure for `spec.md`:**

```markdown
# Spec: [Idea Name]
Generated: [date] from ProveIt validation
Confidence at handoff: D[X]/V[X]/F[X]
Brand: [from brand.md if it exists, else "TBD"]

## Problem statement
[2-3 sentences from brain dump + discovery. No jargon, no buzzwords.]

## Target user
- **Primary persona:** [from discovery]
- **Job to be done:** [JTBD framing]
- **Today's workaround:** [the real competitor]
- **Switching trigger:** [what would make them try this]

## Success metrics
[3-5 measurable outcomes. PULL FROM kill criteria in pre-mortem-N.md "we keep going if" list — so the team's leading indicators are the same conditions the PM committed to monitor.]

| Metric | How measured | Target by [timeframe] |

## Functional requirements
### F1. [User-facing function]
- **What:** [user-visible behaviour]
- **Why:** [link back to problem statement]
- **Acceptance:** [3-5 testable bullet conditions]
### F2. ...

## Non-functional requirements
- **Security:** [auth model, data classification, threat surface]
- **Performance:** [target latency, load profile]
- **Accessibility:** [WCAG level target]
- **Reliability:** [uptime target, failure modes from pre-mortem]

## Out of scope
[Deliberately NOT covered. Most important section to prevent scope creep.]

## Open questions and assumptions
| Question | Current assumption | Owner to resolve | By when |

## T-shirt size and technical risks
[From Technical Feasibility swarm agent + discovery feasibility questions.]

## References
- discovery.md, pre-mortem-N.md, research-N.md, swarm-N-synthesis.md, review-N.md, brand.md
```

**Critical link:** Success metrics in `spec.md` are not invented — they come from `pre-mortem-N.md`'s "we keep going if" list. The PM's strategic kill criteria become the team's leading indicators. No metric divergence between strategy and delivery.

## Swarm composition: menu-driven

**Default 5 (always run):**
- Market Bull, Market Bear, Customer Impact, Technical Feasibility, Devil's Advocate

**Conditional 2 (run when criteria met):**
- **GTM / Distribution** (`swarm-N-gtm.md`) — include if (a) consumer-facing, (b) discovery surfaced "how would they find it?" as weak, (c) competitive landscape is crowded.
- **Pricing / Monetisation** (`swarm-N-pricing.md`) — include if (a) PM grappling with free vs paid, (b) pricing affects core value prop, (c) Viability < 6, (d) non-obvious price anchors.

ProveIt states chosen composition explicitly to PM before spawning so PM can object.

Each agent prompt embeds named frameworks (e.g. April Dunford for GTM positioning, Madhavan Ramanujam for pricing/WTP) AND suggested `mcp__lenny-transcripts__search_transcripts` queries.

## Tool integration: lenny-mcp

**Install:** `claude mcp add -t http -s user lenny-transcripts https://lenny-mcp.onrender.com/mcp`

**Source:** [akshayvkt/lenny-mcp](https://github.com/akshayvkt/lenny-mcp). MIT licence. 284 episodes of Lenny's Podcast.

**Tool surface:**
- `mcp__lenny-transcripts__search_transcripts` — keyword search across all episodes
- `mcp__lenny-transcripts__get_episode` — full transcript for a specific guest
- `mcp__lenny-transcripts__list_episodes` — list of all available episodes

**When to call from agent code:** Documented inline in `agents/proveit.md` per phase. Top suggested queries:
- Discovery → "switching forces", "jobs to be done", "continuous discovery", "ICP", "willingness to pay", "PMF survey"
- Pre-Mortem → "thinking in bets", "tarpit", "why startups fail", "kill criteria"
- Swarm agents — embedded queries per role (see `agents/proveit.md` for the full list)

## Test plan

There are no automated tests for the agent prompts (markdown specs). Verification is real-world:

1. **Wedding Speech Roaster** validation queued in `~/code/proveit-strategy/HANDOFF.md` — first end-to-end test of the new structure.
2. **Strategic validation** (paid vs portfolio) — second test, longer-running.
3. **Manual prompt review** — the prompts have been authored against live Lenny MCP query results to ground guest attributions.

Outcomes to watch on the first real run:
- Does Phase 6.5 produce 3 specific kill criteria with calendar dates? (If still vague, the prompt needs another pass.)
- Does the conditional Pricing agent fire correctly for the Wedding Speech Roaster (Viability uncertainty, free→£19 upsell)?
- Does `spec.md` correctly pull success metrics from `pre-mortem-N.md`'s "we keep going if" list?
- Does the Lenny tool actually get called by subagents during research?
