# Plan: Agent Maturation, Pre-Mortem Phase, and Spec Output

> **Historical note (2026-07-09):** The BrandIt / Brand Identity phase referenced in this document was removed from ProveIt in v3.8.0 (phases renumbered; no brand outputs) — see the `docs/design.md` changelog. Kept as a historical record; do not implement from it.


**Date:** 2026-05-09
**Author:** Claire Donald
**Status:** Implemented (commits `81ae8c9`, `a1728b4`)
**Related spec:** [`docs/specs/2026-05-09-pre-mortem-and-spec-output.md`](../specs/2026-05-09-pre-mortem-and-spec-output.md)

## Why now

Claire is using ProveIt herself for a meta-validation (ProveIt-on-ProveIt — the strategic decision between paid product vs portfolio piece). She wanted methodology improvements that pay off **regardless of which strategic path wins**:

1. Lenny MCP refresh — the agents were originally seeded with named PM frameworks (Bob Moesta, Shreyas Doshi, Sean Ellis, Teresa Torres) before [`lenny-mcp`](https://github.com/akshayvkt/lenny-mcp) existed. Now that the MCP is live (284 podcast episodes, full-text search), the agents should both *carry* the embedded frameworks AND *call* the MCP at runtime for current context.
2. Research swarm review — assess whether 5 agents is right, identify gaps in coverage.
3. Stage after research swarm — currently goes straight from Cross-Model Review to BrandIt; missing a deliberate decision-support / falsification step.
4. PRD / spec output — currently the only engineering-facing artefact is the Gamma deck, which is for stakeholder conversation, not ticketing.
5. Claude design handoff — clarify how the validation flow connects to design work.

The strategic validation will resolve which methodology choices matter most going forward, but these five are useful even if the answer is "portfolio piece" — Claire is the user.

## Decisions

### 1. Lenny MCP integration

**Decision:** Install `lenny-transcripts` at user scope and bake both *durable structure* (named frameworks in agent prompts) and *runtime calls* (`mcp__lenny-transcripts__search_transcripts` queries) into ProveIt.

**Rationale:** A pure runtime-search approach is fragile — agents have to reinvent the right query each session. A pure prompt-bake approach ages — the embedded framings become stale as Lenny adds episodes. Hybrid wins: durable framework attribution + runtime search to verify and extend.

**Implementation:** Each swarm agent prompt now lists 3–5 named guests + their frameworks, plus 2–4 suggested `search_transcripts` queries. Cross-cutting tools section in the agent file documents the Lenny tool surface.

### 2. Research swarm composition

**Decision:** Make the swarm menu-driven (5–7 agents, picked per idea profile) rather than fixed at 5.

**Rationale:** The 5 default agents (Market Bull/Bear, Customer Impact, Tech Feasibility, Devil's Advocate) cover most ideas, but two important angles aren't being explicitly debated: **distribution** (kills more products than product itself) and **pricing** (matters more given Claire's paid-vs-free question). Both have strong Lenny coverage (April Dunford, Brian Balfour, Elena Verna for GTM; Madhavan Ramanujam, Patrick Campbell, Kyle Poyar for pricing).

Forcing 7 agents on every run is expensive and noisy; making them conditional preserves the speed of the default path while letting the swarm sharpen for relevant cases.

**Selection criteria** (documented in the agent file):
- **GTM / Distribution:** include if consumer-facing, distribution-as-differentiator, or "how would they find it?" was weak in discovery.
- **Pricing / Monetisation:** include if PM is grappling with free vs paid, pricing affects core value prop, Viability < 6, or category has non-obvious price anchors.

ProveIt states the chosen composition before spawning, so the PM can object before agents spawn.

### 3. Phase 6.5 Pre-Mortem & Kill Criteria

**Decision:** Insert a new phase between Cross-Model Review and BrandIt. Output: `pre-mortem-N.md` with explicit falsification tests, calendar kill dates, and a "Live bets" section added to `discovery.md`.

**Rationale:** The pipeline previously had no phase that explicitly produced falsifiable kill criteria. The Findings Review + Cross-Model Review identify *unknowns*, but unknowns aren't kill conditions. The pre-mortem turns "things to validate" into "if X isn't true by date Y, stop." This is the actual decision-support moment.

**Anchored by:** Annie Duke (Thinking in Bets / Quit) — confirmed via live Lenny search as the top voice on pre-mortem framing in the archive. Plus Shreyas Doshi (pre-mortem framework, levels of strategy) and Sean Ellis (PMF survey 40% threshold as a kill criterion).

### 4. Output 3: `spec.md`

**Decision:** Add a third output in Phase 9 — a structured PRD for engineering handoff alongside the Gamma deck.

**Rationale:** Engineers don't read decks. The Gamma deck is for the leadership / stakeholder conversation; the spec is for the ticket queue. Structuring it for Linear/Jira/Notion drop-in means the validation work directly lowers the cost of getting to "tickets in flight". Critically, the success metrics in `spec.md` pull from the kill criteria in `pre-mortem-N.md`, so the team's leading indicators are the same conditions the PM committed to monitor — no metric divergence between strategy and delivery.

### 5. Claude design canvas handoff

**Decision:** Add a manual handoff option in Phase 10 — drop `discovery.md` + `brand.md` into a fresh claude.ai/design chat to get UX flows and wireframes. No new automated phase.

**Rationale:** Automating the design handoff would require either an `@designer` Claude Code subagent invocation or a deeper claude.ai integration. Both add complexity and risk that the design output doesn't respect the validation work. Manual handoff is honest about the current capability and gives the PM control over how much design depth they want.

## Out of scope (deferred)

- Discovery question table doesn't get the framework-table treatment yet (later added in `a1728b4`).
- CLAUDE.md doesn't yet mention Lenny MCP — will refresh on next docs pass.
- No automated test of the new prompt structure against a real idea yet (that's the strategic validation session itself).
- Other Todoist questions (Lenny MCP for agent knowledge refresh — *done*; ShipIt revamp to pick up from ProveIt — *separate plan needed*; cross-model review on the deck — *separate*).

## Migration / risks

- **Existing in-flight sessions** (`discovery.md` files in user project dirs) won't have a "Live bets" section. Phase 6.5 will create one on next run; no migration needed.
- **Lenny MCP availability** — the server is hosted at `lenny-mcp.onrender.com` (free tier on Render). If it's down, the agents fall back to their embedded framework names + Firecrawl/WebSearch.
- **Token cost** — adding GTM and Pricing agents adds ~30% to swarm cost when they fire. The conditional logic keeps them off the default path.
- **Swarm output volume** — 7 swarm files instead of 5 means the synthesis agent ingests more content. Token-bounded but the synthesis structure is the same.

## Verification

- Build / lint / tests pass on the plugin: there are no automated tests for the agent prompts (they're markdown specs); the verification is a real `/proveit` run against an idea (currently teed up: Wedding Speech Roaster, validation queued in `~/code/proveit-strategy/HANDOFF.md`).
- Live Lenny MCP query confirmed during this work: searches for "pre-mortem", "switching forces", "tarpit", "willingness to pay", "growth loops", "positioning" returned current top guest matches. Annie Duke (pre-mortem), Dalton Caldwell (tarpit), Madhavan Ramanujam (WTP), April Dunford (positioning), Adriel Frederick (switching) — guest attributions are grounded in real data, not fabricated.
