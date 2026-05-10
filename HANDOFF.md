# Session Handoff — 2026-05-10

**Next session focus:** Explore how to use Claude Design better / more for ProveIt. Today's session ran long with two abuse-prevention layers (v3.3 spend ceiling, v3.4 waitlist) on top of the methodology evolution; Claude Design exploration is the primary unfinished thread.

---

## Session Summary

Six releases shipped today across the plugin and the web app:

- **v3.0 (`81ae8c9`, `a1728b4`, `70cf74e`)** — Agent maturation pass. Embedded named expert frameworks (17 anchors, ~34 total), integrated [`lenny-mcp`](https://github.com/akshayvkt/lenny-mcp) as a runtime tool, added Phase 6.5 Pre-Mortem & Kill Criteria (Annie Duke / Shreyas Doshi anchored), Output 3 (`spec.md` engineering PRD with success metrics tied to pre-mortem kill criteria), and the manual claude.ai/design canvas handoff in Phase 10.
- **v3.1.0 (`40c7938`)** — Three new swarm agents: Defensibility / Moat (default, Hamilton Helmer's *7 Powers*), AI Commoditization (default-on-conditional), Regulatory / Compliance (default-on-conditional). Swarm refactored to opt-out (up to 10 agents). Adaptive Fast Check 7-category catalog. Phase 6.7 Wave 3 — Scenario & Experiment with paste-ready experiment artefacts. Customer Impact + Tech Feasibility fold-ins (retention/habit + ops/unit-economics).
- **v3.2.0 (`7066486`)** — Phase 0 Intake before Brain Dump capturing context type (new vs iteration on existing) and prior context. BrandIt becomes truly conditional — skipped automatically for `contextType: existing`. Explicit Brand / Claude Design / Gamma boundary table documented in Phase 7, Phase 10, and design.md.
- **v3.2.1 (`589faa4`, `43af17a`)** — Web app methodology brought in sync with plugin v3.2 at the prompt layer. Adaptive Fast Check + Phase 0 Intake + Live Bets + framework anchoring all live on proveit-web-zeta.vercel.app. Caught and fixed a category-metadata regression.
- **v3.3.0 (`f83c70a`)** — **Tier 1 abuse prevention.** Server-side daily spend ledger + circuit breaker (`web/src/lib/spend-ledger.ts`). Two ceilings — global daily (`DAILY_SPEND_CEILING_USD`, **now $1** in production after lowering from $5 mid-session) and per-IP daily (`PER_IP_DAILY_CEILING_USD`, default $1). 503 with friendly "portfolio piece — capped" message when breached. Tier 2 (full email gate) and Tier 3 (auth + paid) deferred to issue #22.
- **v3.4.0 (`170ec3f`)** — **Email-capture waitlist** for users hitting the spend ceiling. Lighter-touch than full Tier 2 — no auth, no quota-per-email, just an inline form ("Want more access? Drop your email") rendered when /api/fast or /api/chat returns 503. Submissions land in a Supabase waitlist table (project `bbpdicijaqoujnpidiho`, free tier, eu-west-2; migration check-in at `web/supabase/migrations/20260510_create_waitlist.sql`). RLS-enabled, anon publishable key has INSERT-only access. End-to-end smoke test verified: form posts → /api/waitlist → Supabase row appears. Privacy posture is light-touch (no marketing automation, emails go to Claire directly).

**Browser-verified via Playwright:**
- Fast Check on a regulated AI idea correctly picked **Regulatory + Desirability + Viability** (not D/V/C) with cited UK GDPR / ICO / NSPCC / NHS Digital sources.
- Full Validation on an iteration idea correctly fetched the parent URL via `web_search` in `brain_dump`, summarised it, adapted questions to iteration framing.

**Smoke test confirmed v3.3 live:** `curl POST /api/fast` returns 200 normally (spend ledger has headroom). 503 paths covered by integration tests; producing a real 503 in production would require temporarily setting a low ceiling, which would block real users — verification stays at the integration-test layer.

**Todoist:** existing task `6gc9RjXVxFMFFwJG` (Validate ProveIt's path: paid product or portfolio piece) still queued at p3 in the ProveIt refresh 🧪 project.

---

## Current State

- **Branch:** `main`. All commits pushed. Working tree clean apart from `HANDOFF.md` itself (this file, being updated).
- **Last commit:** `170ec3f` — `feat(web): v3.4 email-capture waitlist (Supabase) for users hitting spend ceiling`
- **Latest GitHub release:** [v3.4.0](https://github.com/cla1redonald/proveit/releases/tag/v3.4.0)
- **Production deploy:** [proveit-web-zeta.vercel.app](https://proveit-web-zeta.vercel.app) — Ready, smoke-tested end-to-end (Fast Check returns 200; /api/waitlist accepts and writes to Supabase). Anthropic SDK 0.95.1, Upstash rate limiting + spend ledger + Supabase waitlist all active, Roami Deep Tay palette, Phase 0 Intake live.
- **Tests:** 219/219 passing in `web/`. Plugin agent prompts have no automated tests (markdown specs only).
- **Lint / typecheck / build:** all clean.
- **Open PRs:** 0
- **Open GitHub issues:** 3 — #20 (GTM/monetisation strategy, blocking), #21 (web product roadmap, blocked on #20), #22 (Tier 2 + Tier 3 abuse prevention, deferred — note v3.4 is *lighter* than Tier 2, doesn't fully resolve #22).
- **Vercel env vars in production:** `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DAILY_SPEND_CEILING_USD=1` (lowered from $5 mid-session), `PER_IP_DAILY_CEILING_USD=1`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.
- **Supabase project:** `proveit-web` (`bbpdicijaqoujnpidiho`), eu-west-2, free tier, in the existing Roami org. Read the waitlist via the Supabase dashboard.
- **Lenny MCP:** installed at user scope. Active in any new Claude Code session.

---

## Open Issues / Known Tensions

### 1. Phase 0 protocol vs intelligent skip (observation, not bug)

In the Full Validation smoke test, the model **skipped the explicit "is this new or iteration?" preamble** because the user's input ("Adding habit streaks to *our existing* journaling app at https://dayoneapp.com") made the answer obvious. Two views — both have merit:
- *Smart adaptation:* asking the question when the answer is in the input would feel pedantic
- *Spec drift:* Phase 0 is supposed to *always* run; skipping it for clear cases means it might also be skipped in less-clear cases

Worth deciding consciously next session, not as part of Claude Design exploration.

### 2. Plugin-side test pass not yet run

The matured plugin (v3.2) hasn't been exercised against a real idea since the changes shipped. The Wedding Speech Roaster validation queued in `~/code/proveit-strategy/HANDOFF.md` (Todoist `6gc9RjXVxFMFFwJG`) is the natural first run. Will surface whether the 10-agent opt-out swarm produces useful output, whether Phase 6.5 Pre-Mortem produces 3 specific bets with calendar kill dates, whether Wave 3 produces paste-ready artefacts (or templates), and whether the Lenny MCP is actually called by subagents.

### 3. `agents/proveit.md` is now ~1900 lines

Still readable but at this size worth considering a multi-file split. Need to confirm Claude Code's plugin model supports the split pattern before refactoring.

### 4. Spend ceilings need real-world tuning

Defaults ($5 global / $1 per-IP) are conservative. If real users keep tripping them, raise. If abuse signals appear, drop and ship Tier 2 (email gate). Watch the `proveit:spend:*` keys in Upstash console for actual usage shape.

---

## Next Session: Claude Design integration with ProveIt

### What's already decided about Claude Design (don't relitigate)

The **Brand / Claude Design / Gamma boundary table** in `agents/proveit.md` Phase 7 + Phase 10 and `docs/design.md` says:

| Tool | Produces | Does NOT produce |
|------|----------|------------------|
| **BrandIt** | Brand SYSTEM — name, tagline, palette, typography, logo, design tokens, tone of voice | UX, wireframes, screens, marketing copy beyond tagline |
| **Claude Design** (claude.ai/design canvas) | Product UX — wireframes, user flows, screens, interaction states. Uses brand tokens as input. | Brand identity (assumes brand exists), engineering spec, marketing copy |
| **Gamma** | Stakeholder DECK — slides for leadership / funding / team. Uses brand for visual cohesion. | UX, engineering spec, brand identity, executable artefacts |

**Currently:** Claude Design is a **manual Phase 10 handoff** — the user opens claude.ai/design in a fresh chat and pastes `discovery.md` + `brand.md` (or inherited assets). ProveIt doesn't drive it directly.

### Questions to explore next session

1. **What does the claude.ai/design canvas actually do well right now?** Worth opening it and trying it on a real validated idea before designing the integration. Don't design for assumed capabilities.
2. **Could ProveIt produce a *design brief* artefact** alongside the Gamma deck and `spec.md`? Format: target user + JTBD + key screens + interaction patterns + brand tokens. Low-risk addition.
3. **Should there be a Phase 7.5 Design Handoff** as a proper phase (not a Phase 10 next-step option)? Pros: makes design first-class. Cons: requires Claude Design to be reliably callable from ProveIt's runtime, which it isn't today.
4. **Where does Claude Design fit for `contextType: existing` sessions?** Iterations on an existing brand have inherited UX. Does Claude Design need to read the existing product first? How does it diff against the existing UX?
5. **Web app side** — if Claude Design becomes a real downstream step for the plugin, what's the equivalent web-app handoff? Could be as simple as the downloaded `discovery.md` being structured to drop cleanly into claude.ai/design.
6. **Does claude.ai/design have an API or MCP** that would let ProveIt call it programmatically? If yes, that opens up a real integration. If no, it stays manual.

### Suggested approach for next session

1. Open claude.ai/design and spend 15–20 minutes trying it manually on something real — Wedding Speech Roaster (after Fast Check) or another familiar idea. Build mental model of what it does well.
2. From that grounding, decide which of questions 2–5 are worth answering by doing vs deferring.
3. Write a small spec doc in `docs/specs/` for whichever Claude Design integration shape emerges.
4. Implement it. Likely lighter than v3.1 / v3.2 since this is one new artefact + boundary-respect, not a whole new methodology layer.

### Key files / docs to read first

- `agents/proveit.md` Phase 7 (~line 1141) — current Brand/Design/Gamma boundary
- `agents/proveit.md` Phase 10 (~line 1486) — current Claude Design as next-step
- `docs/design.md` Section 7 — boundary table from a design-doc lens
- `docs/plans/2026-05-10-phase-0-intake-and-context-type.md` — most recent decision doc, useful as a model for the Claude Design plan
- `docs/specs/2026-05-10-phase-0-intake-and-context-type.md` — most recent spec doc, useful as a model

---

## Resume Prompt

Open a new Claude Code session in this directory:

```bash
cd ~/code/proveit
claude
```

Then paste this exact prompt:

```
/preflight

Then: read HANDOFF.md in this directory. The focus this session is exploring how to use Claude Design (claude.ai/design canvas) better and more for ProveIt. Read the boundary table in agents/proveit.md around Phase 7 and Phase 10 first so we're not relitigating what's already decided.

Before designing any integration, I want to spend 15–20 minutes actually trying claude.ai/design manually on a real validated idea so we both have a current mental model of what it does well. After that, work through the open questions in HANDOFF.md (especially: design-brief artefact alongside the Gamma deck? Phase 7.5? How does it work for contextType=existing? Does claude.ai/design have any API/MCP we could call?).

Don't blow through the strategic decision in #20 — anything that becomes web-app work stays gated on that. Plugin-side improvements are fine to ship.

Active todos worth knowing about:
- Validate ProveIt's path: paid vs portfolio (Todoist 6gc9RjXVxFMFFwJG, p3) — still pending
- v3.2 plugin test run on Wedding Speech Roaster in ~/code/proveit-strategy/ — still pending
- Tier 2 abuse prevention (email gate) is captured in issue #22 if v3.3's ceilings ever start tripping in practice

End-of-session expectation: a Claude Design integration plan + spec under docs/, ideally an implementation if scope permits, GitHub release for whatever ships.
```
