# Session Handoff — 2026-05-10 (full day)

**Recommended next focus:** Execute the 30-day launch. Read `docs/STRATEGY.md` first, then start working pre-launch epic #24 stories in order. The Wizard-of-Oz friend-cohort test (#30) is the single highest-leverage thing to ship first.

For PR / marketing agents reading this from outside the engineering context: read `docs/BRIEF.md` instead — it's the audience / positioning / voice / do-and-don't summary.

---

## Session Summary

A uniquely large single day. Three distinct streams of work, all landed:

### 1. Shipped v3.5.0 — Claude Design integration

PR [#23](https://github.com/cla1redonald/proveit/pull/23) merged. Release tagged at [v3.5.0](https://github.com/cla1redonald/proveit/releases/tag/v3.5.0). Six commits.

- `agents/proveit.md` Phase 9: two new outputs — `design-brief.md` (synthesis any designer can read on its own) and `claude-design-prompts.md` (paste-ready prompts for claude.ai/design — deck, wireframes, logos, social cards). Each pre-populated with the PM's evidence.
- Phase 10 closing message rewritten — surfaces the `Design systems` top-level tab on claude.ai/design and the `Handoff to Claude Code` Share-menu button. No longer apologetic.
- Phase 7 + Phase 10 boundary tables nuanced with a logo-overlap paragraph.
- New `FullBundlePointer.tsx` on Full Validation completion — points users to `/proveit` in Claude Code for the full bundle. 3 unit tests added (230/230 passing).
- Memory graduated three patterns to `memory/shared/*` and `memory/agent/proveit.md`: observation-first integration design (expert framework), one-direction-analysis-as-constraint (common mistake), conditional-branch-asymmetry-in-paired-outputs (common mistake).

Grounded in a 5-probe Playwright study of `claude.ai/design` driven autonomously after one manual login. The observations and design docs were at `.session-state/` (gitignored, intentionally not committed).

### 2. Production infrastructure for the live URL

- **`proveit.tools` purchased** on GoDaddy (£11 first year, £41/yr renewal). Independent of Roami brand — kept ProveIt's identity separable.
- **Vercel domains attached** to project `proveit-web`. `www` → apex 308 redirect via Vercel API.
- **DNS at GoDaddy** — A `@` and A `www` both at Vercel `76.76.21.21`. SSL auto-provisioned.
- **Resend domain verified** for `proveit.tools` via Domain Connect OAuth (DKIM at apex, SPF/MX at `send.proveit.tools` subdomain).
- **`WAITLIST_FROM_EMAIL=hello@proveit.tools`** set in Vercel production env, redeployed.
- **End-to-end smoke test passed** — POST /api/waitlist → 200 → email arrived in `cla1re@me.com` with correct From, Reply-To, Supabase dashboard link, formatting.

### 3. Ran `/proveit` against ProveIt's own GTM strategy (recursive validation)

Output lives at `~/code/proveit-strategy/` — **gitignored, session-only artefacts**. Phases 0–9 completed, including:

- Phase 0–2: Brain dump + structured discovery. Surfaced three personas, with Gemma at MOO as the real-person anchor.
- Phase 3: Research (PostHog "Product management is broken" externally validates the thesis; Substack Notes algorithm mechanics; Lenny / Shreyas / Aakash trajectories).
- Phase 4: Findings review. Scores: D8 / V6 / F8 — all above the 6+ threshold to proceed.
- Phase 5: 7-agent adversarial swarm (Bull, Bear, Customer Impact, Tech Feasibility, Devil's Advocate, Defensibility, GTM/Distribution). Full synthesis written.
- Phase 6.5: Pre-mortem with kill criteria. Three numbers, all must hit by day 30.
- Phase 9: STRATEGY.md output + Gamma deck.

**Strategic frame Claire decided:**
- **Profile-primary** — raise Claire's profile, build a strong portfolio piece. Inbound interest is the success metric.
- **Cost-covered** — ~£40/mo MRR floor (8 paying users at £4.99/mo or 4 at £9.99/mo). Falsifiable.
- **Low-income tolerant** — explicit. No revenue ceiling. If it takes off, it takes off.

**Pricing model:** Shape C freemium — validation experience always free (no credit gating, no logins), bundle download paid. Two transaction shapes: £4.99 one-off OR £9.99/mo subscription.

**Differentiators (vs ChatGPT, Notion AI, Maze AI, Dovetail Magic, ProductBoard AI):**
1. **Active disagreement** — the only PM tool that tells you your idea might be bad
2. **Air-gap bundle** — multi-format output that crosses into locked-down orgs and creates visible AI-usage proof for the PM's manager

**Real moat (per Phase 5 swarm):** the verifiable shipped artefact + named methodology operationalised into running software. GitHub commit history is timestamped. proveit.tools is live. v3.5 ships. No other PM creator currently active can claim this combination without doing the same work.

### 4. GitHub repo organisation

- **Issue [#20](https://github.com/cla1redonald/proveit/issues/20) closed** via commit `0a8dfde` — STRATEGY.md + strategy-pre-mortem committed to `docs/`. Comprehensive closing comment summarises the strategic decision.
- **Issue [#21](https://github.com/cla1redonald/proveit/issues/21) closed** with audit comment — 3 items promoted to new stories (#40, #41, #42), 2 items already covered (#29, #32), ~12 items explicitly deferred with concrete reasons.
- **GitHub Project #4 ("ProveIt 30-day GTM Launch")** created at https://github.com/users/cla1redonald/projects/4. **19 items** (4 epics + 15 stories):
  - **Epic #24** Pre-launch infrastructure: stories #28, #29, #30, #41, #42 (5)
  - **Epic #25** Shareability mechanics: stories #31, #32, #33 (3)
  - **Epic #26** Monetisation infrastructure (gated on WoZ): stories #34, #35, #36, #37, #40 (5)
  - **Epic #27** Moat maintenance (month-2, gated on day-30 kill criteria): stories #38, #39 (2)
- Labels created: `epic`, `story`, `pre-launch`, `gated-on-woz`, `month-2`.

---

## Current State

- **Branch:** `main`. Working tree clean.
- **Last commit:** `0a8dfde` — `docs: add STRATEGY.md and pre-mortem (closes #20)`
- **Latest GitHub release:** [v3.5.0](https://github.com/cla1redonald/proveit/releases/tag/v3.5.0) — Claude Design integration
- **Production deploy:** **[proveit.tools](https://proveit.tools)** (primary alias). `www.proveit.tools` 308s to apex. Smoke-tested end-to-end including the email-from address.
- **Tests:** 230/230 passing in `web/`. Plugin agent prompts have no automated tests (markdown specs only).
- **Lint / typecheck / build:** all clean.
- **Open PRs:** 0
- **Open GitHub issues:** 1 active (#22 Tier 2 abuse prevention, deferred per strategy). Plus 16 stories + 4 epics in Project #4 (all open by design — they're the backlog).
- **Domain:** `proveit.tools` (GoDaddy registrar, GoDaddy DNS).
- **Vercel env vars (production):** `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DAILY_SPEND_CEILING_USD=1`, `PER_IP_DAILY_CEILING_USD=1`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `WAITLIST_NOTIFY_EMAIL=cla1re@me.com`, `WAITLIST_FROM_EMAIL=hello@proveit.tools`.
- **Supabase project:** `proveit-web` (`bbpdicijaqoujnpidiho`), eu-west-2.
- **Resend account:** `proveit.tools` domain verified. `hello@proveit.tools` confirmed sending end-to-end.
- **Lenny MCP:** installed at user scope.
- **Playwright MCP:** installed today; useful for any UI verification work in stories #41 / #33.
- **Vercel MCP plugin:** active.

---

## Open Issues

### Strategic — answered

The big strategic question (#20 GTM/monetisation) is **answered and committed**. Key documents:

- `docs/STRATEGY.md` — the load-bearing strategy doc. Audience, pricing, free/paid line, differentiators, 90-day GTM motion. Read this first.
- `docs/strategy-pre-mortem.md` — the kill criteria contract. Annie Duke pre-commit. Three numbers all must hit by day 30 (June 10, 2026). **Re-read before the day-30 review.**

The full reasoning trail (gitignored, session-only): `~/code/proveit-strategy/{discovery,research-1,swarm-1-*,swarm-1-synthesis,pre-mortem-1}.md`

### Backlog — Project #4

Active in priority order (work pre-launch first):

**Pre-launch (epic #24, must ship before Substack Post #1):**
- `web/src/components/validate/FullBundlePointer.tsx` → replace with WoZ email-capture CTA (#30, ~3h work)
- Vercel env: raise `DAILY_SPEND_CEILING_USD` from 1 to 5 (#28, ~5min)
- Add PostHog or Vercel Analytics (#29, 5–30min)
- Mobile streaming verification across viewports (#41)
- Sentry / error tracking (#42)

**Shareability (epic #25, parallel to launch content):**
- "Made with ProveIt" Gamma watermark (#31, lowest-build/highest-leverage)
- D/V/F score share card with OG meta (#32)
- Kill-signal screen designed for screenshot-shareability (#33)

**Monetisation infrastructure (epic #26, gated on WoZ):**
- Stripe Checkout one-off £4.99 (#34) — only build if WoZ converts
- Resend bundle delivery email (#35)
- Supabase `orders` table (#36)
- Stripe Checkout subscription £9.99/mo (#37, month-2)
- Server-side Gamma deck generation (#40 — needed because web currently only outputs markdown; bundle requires the deck)

**Moat maintenance (epic #27, month-2):**
- Miro board output artefact (#38)
- Notion page output artefact (#39)

### Known issues / housekeeping

- **One Supabase row to delete at leisure:** `claude-smoke-test+2026-05-10@proveit.tools` in `waitlist` table. [Supabase dashboard](https://supabase.com/dashboard/project/bbpdicijaqoujnpidiho/editor).
- **Confirm `cla1re@me.com` is the long-term `WAITLIST_NOTIFY_EMAIL`** — currently set in Vercel production env, was deliberately typo-isolated for spam protection but worth re-checking now that the live URL is real.
- **`agents/proveit.md` is ~2150 lines after v3.5.** Multi-file split is a candidate refactor; not urgent.

### What this strategy explicitly does NOT do

(For future sessions tempted to relitigate — these are deliberate scope decisions, not open questions):
- Does NOT build for Tier C (org sales) in 30 days
- Does NOT optimise for revenue (cost-cover floor only; bonus above)
- Does NOT chase virality
- Does NOT enable Substack paid tier in month 1
- Does NOT pursue speaking, podcasts, or courses in month 1 (inbound only)
- Does NOT commit to writing past Post #3 unless kill criteria hit
- Does NOT ship Miro/Notion integrations in month 1 (epic #27 is month-2 work)
- **Does NOT add user accounts / auth** — `STRATEGY.md` is explicit: "no login on either side." This is load-bearing.

---

## Resume Prompt

Pick a focus from below, then in a fresh Claude Code session:

```bash
cd ~/code/proveit
claude
```

Paste this — edit the focus line for whichever thread you want, delete the others:

```
/preflight

Then: read in this order — docs/STRATEGY.md → docs/strategy-pre-mortem.md →
HANDOFF.md → Project #4 (https://github.com/users/cla1redonald/projects/4).

The focus this session is [PICK ONE]:

  Option A — (RECOMMENDED) Execute pre-launch epic #24 in order:
             1. #28 — Raise DAILY_SPEND_CEILING_USD from 1 to 5 (~5 min)
             2. #42 — Add Sentry / error tracking (~30 min)
             3. #29 — Add PostHog or Vercel Analytics (~30 min)
             4. #41 — Mobile streaming verification (~1-2 hrs)
             5. #30 — Replace FullBundlePointer with WoZ email-capture CTA (~3 hrs)

             Then write Substack Post #1 (the load-bearing artefact).
             #30 is the single highest-leverage thing — it gates Week 1's
             Wizard-of-Oz friend-cohort test which gates everything else.

  Option B — Write Substack Post #1 in parallel (this is the load-bearing
             content artefact). Headline candidate: "What ChatGPT won't tell
             you about your product idea." See docs/STRATEGY.md §"What
             Substack post #1 says" for the structural brief.

  Option C — Wire up the friend-cohort outreach. Identify the 5-10 PM-adjacent
             friends to DM. Draft the personal-message template. See
             pre-mortem-1.md "Bet 4" — running this in parallel with content
             writing is the bandwidth risk specifically called out as the
             most likely failure mode.

  Option D — Plugin file split: agents/proveit.md is 2150 lines. Confirm
             Claude Code's plugin model supports multi-file split with
             agents/proveit.md as index, then refactor. Not urgent.

  Option E — #22 Tier 2 abuse prevention. Useful only if Tier 1 ceilings
             start tripping in real usage — no signal yet.

The day-30 launch review is on June 10, 2026. Re-read
docs/strategy-pre-mortem.md COLD before that review, then read the data.
DO NOT relitigate the strategic decision in #20 — it is committed and
falsifiable. Execute, measure, honour the kill criteria.

Trivial cleanups while you're in there (~5 min total):
- Delete Supabase row claude-smoke-test+2026-05-10@proveit.tools
- Sanity check WAITLIST_NOTIFY_EMAIL=cla1re@me.com is correct
```

End-of-session expectation: a release for whatever ships, plus an updated HANDOFF.md.

---

## For PR / marketing agents reading this

This is the engineering / next-Claude-session handoff. The PR / marketing-facing brief lives at **`docs/BRIEF.md`** — single-page summary of audience, positioning, voice, narrative spine, do's / don'ts, key dates. Start there if you're shaping copy or campaigns. This file is for execution context.
