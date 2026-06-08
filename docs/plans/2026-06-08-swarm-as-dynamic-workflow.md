# Plan: Convert the Research Swarm to a Dynamic Workflow

**Date:** 2026-06-08
**Status:** Proposed — for review
**Author:** Claire Donald (with Claude)

## Why

The Deep Dive swarm (Phase 5) is ProveIt's heaviest reasoning engine — up to 10 agents arguing opposing angles, then a synthesis. It is currently **described in prose** in `agents/proveit.md`: "spawn all chosen agents in a single message with parallel Task calls." That prose orchestration is exactly the pattern Pawel Huryn's *dynamic workflows* piece warns against:

- **Agentic laziness** — "spawn 10 agents" can quietly become 7; nothing enforces completeness.
- **Self-preferential bias** — each swarm agent rates its own confidence (1–5); the synthesis trusts those self-grades. No independent check.
- **Goal drift** — the swarm question lives in a context window that compacts over a long session.
- **Non-determinism** — a re-run can spawn a different set, in a different order, with different merge behaviour.

The `frontier-scan` workflow (shipped 2026-06-08) proved the fix on a contained feature: code coordinates (which agents, dedup, the stale-source filter, the diff), the model judges inside each agent, and an **adversarial verify stage** kills weak claims. This plan brings that same discipline to the part of ProveIt that runs on serious validations — so *every* Deep Dive gets completeness, independent verification, and determinism, not just the frontier scan.

**Scope decision:** start with the **Deep Dive swarm only** (Phase 5). It is the most fan-out-heavy and most self-contained. The standard Research phase (Phase 3) and the Discovery→Research loop are candidates for a *later* pass — explicitly out of scope here to keep blast radius small.

## Design

A new `scripts/swarm.workflow.mjs`, modelled on `frontier-scan.workflow.mjs`. The workflow is a **drop-in replacement** for the prose orchestration: it consumes the same inputs and produces the same output files, so nothing downstream (pre-mortem, cross-model review, Gamma, spec) changes.

### Inputs (passed as `args` — workflow runtime has no filesystem access)
- `question` — the swarm question (the agent crafts this in Phase 5 Step 1, as today).
- `composition` — the selected agents (the opt-out preview in Step 3 stays a human step; the chosen list is passed in).
- `discovery` — full text of `discovery.md` (incl. the Phase 0 prior-context payload).
- `research` — full text of the latest `research-N.md`.
- `mode` — `full` (skeptic-per-agent, Opus synthesis) or `lite` (batched verify, Sonnet) — cost control, mirroring frontier-scan.

### Pipeline
1. **Fan-out (one agent per angle).** Each selected angle (Market Bull/Bear, Customer Impact, Technical Feasibility, Devil's Advocate, Defensibility, + conditional GTM/Pricing/AI-Commoditization/Regulatory) runs as a structured-output agent. The agent prompts move **verbatim** out of `proveit.md` into the script (they are load-bearing — frameworks, Lenny MCP guidance, the required output structure). Output schema = the existing `swarm-N-<angle>.md` structure as JSON (thesis, evidence[] with confidence, risks, overall confidence).
2. **Adversarial verify (NEW — the value-add the prose version lacks).** A skeptic with separate context checks each agent's evidence: does each cited source exist and support the claim? Flag unsupported/over-confident claims. In `full` mode, one skeptic per agent; in `lite`, one batched skeptic per run. This is what removes the self-grading bias.
3. **Synthesize.** The synthesis agent runs on **verified, structured** inputs — it builds the contradiction matrix, the confidence-weighted recommendation, the bias check, and the score-impact block (the existing `swarm-N-synthesis.md` structure). Code computes the deterministic parts (which agents ran, confidence table, dedup of evidence).

### Outputs (unchanged file shapes)
The workflow **returns** the markdown for each `swarm-N-<angle>.md` and `swarm-N-synthesis.md`; the agent writes them to the working dir (same as frontier-scan returns `snapshot_markdown` for the caller to write). `discovery.md` score update and the Phase 6 cross-model review proceed exactly as today.

## Files to change

| File | Change |
|------|--------|
| `scripts/swarm.workflow.mjs` | **NEW** — the dynamic workflow (fan-out → verify → synthesize). Agent prompts moved here verbatim. |
| `agents/proveit.md` (Phase 5) | Replace the "spawn via Task tool" prose (Steps 4–5) with "run `swarm.workflow.mjs` via the Workflow tool, passing {question, composition, discovery, research, mode}." Keep Steps 1–3 (question crafting + composition preview) as human steps. Keep the agent prompts referenced, noting they now live in the script. |
| `docs/design.md` | Changelog entry + update the Phase 5 description. |
| `scripts/frontier-scan.workflow.mjs` | No change — but factor shared helpers (schemas, the verify pattern) into a small `scripts/lib/` if duplication is meaningful. |

## Order of operations

1. **Extract** the 10 agent prompts + the synthesis prompt from `proveit.md` into `swarm.workflow.mjs` as structured-output agents (verbatim — no wording changes in step 1, to isolate the refactor from prompt changes).
2. **Add** the adversarial-verify stage (the new behaviour).
3. **Move** composition selection + confidence weighting + contradiction assembly into code.
4. **Return** the structured result; wire the agent (Phase 5) to write the files.
5. **Validate** on one real idea end-to-end (cost-estimated first — see Risks). Compare output file shapes against a prose-swarm baseline.
6. **Update** `agents/proveit.md` Phase 5 prose + `docs/design.md`.

## Risks & open decisions

- **Workflow tool availability.** Dynamic workflows are a Claude Code research-preview feature (v2.1.154+). ProveIt runs in the PM's own session — if their Claude Code lacks the Workflow tool, the run fails. **Decision needed:** keep the prose swarm as a documented fallback in `proveit.md` (recommended — graceful degradation), vs. hard-require the Workflow tool.
- **Cost (MANDATORY estimate before any run).** The swarm is already ~10 agents on the user's Max session; adding a verify stage adds agents. `full` mode is the deepest (and priciest); `lite` collapses verify. Per the cost rule, the agent must present an estimate before running and offer `lite`. The swarm runs on the user's subscription (interactive session), not an API wallet — but tokens are still real. Cross-reference `2026-05-10-spend-ledger-circuit-breaker.md`.
- **Prompt parity.** The prose agent prompts are carefully tuned (named frameworks, Lenny MCP queries). Migration must be verbatim; any prompt improvement is a *separate* change after parity is confirmed.
- **Filesystem-free runtime.** Like frontier-scan, the workflow can't read files — the agent passes `discovery`/`research` as args and writes the returned markdown. Large inputs are fine (frontier-scan passed the full snapshot).
- **Determinism vs. the human-in-the-loop preview.** The Step 3 composition preview ("here are the N agents I'll spawn — drop any?") must stay a human checkpoint *before* the workflow runs, since the workflow itself runs to completion with no mid-run cancel.

## Success criteria

- A Deep Dive run spawns **exactly** the previewed composition — verifiable in the workflow log (no silent drops).
- Every agent's evidence passes (or is flagged by) an **independent** skeptic — no self-grading reaching synthesis.
- Output files (`swarm-N-*.md`, `swarm-N-synthesis.md`) are shape-identical to today's, so Phase 6+ is unaffected.
- Same idea, re-run, yields the same structure (determinism).
- A cost estimate is shown before the run, with a working `lite` mode.

## Not in scope (future passes)

- Converting Phase 3 standard Research to a workflow.
- Converting the Discovery→Research loop.
- Any change to agent prompt *wording* (parity first; tuning later).
