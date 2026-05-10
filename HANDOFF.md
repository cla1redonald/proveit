# Session Handoff — 2026-05-10 (evening)

**Recommended next focus:** Step back and **properly explore ProveIt's monetisation strategy** before committing to any test. Run `/proveit` in `~/code/proveit-strategy/` against the question. The £19–£29 paid-bundle idea drafted in [issue #20 comment](https://github.com/cla1redonald/proveit/issues/20#issuecomment-4415247134) was a stumbled-into shape, not a strategic decision — it's *one input* into the exploration, not the answer.

---

## Session Summary

Two things landed end-to-end today:

### 1. ProveIt v3.5.0 — Claude Design integration

PR [#23](https://github.com/cla1redonald/proveit/pull/23) merged. [Release v3.5.0](https://github.com/cla1redonald/proveit/releases/tag/v3.5.0). Six commits, all logical chunks (Phase 9 outputs / Phase 10 + boundary nuance / web pointer + test / docs / retro / reviewer fixes).

What changed:
- `agents/proveit.md` Phase 9 gained two new outputs — `design-brief.md` (synthesis any designer can read) and `claude-design-prompts.md` (four paste-ready prompts: deck, wireframes, logos, social cards, each pre-populated with the PM's evidence).
- Phase 10 closing message rewritten — surfaces the **Design systems** top-level tab on claude.ai/design and the **Handoff to Claude Code** Share-menu button as the real round-trip, not an aspirational one.
- Phase 7 + Phase 10 boundary tables nuanced with a logo-overlap paragraph (BrandIt = one finished logo in a brand system; Claude Design = three exploratory directions in 3 minutes; they compose).
- New `FullBundlePointer.tsx` on Full Validation completion → points users to `/proveit` in Claude Code for the full bundle. 3 unit tests added (230/230 passing).
- README, HANDOFF, CLAUDE.md, docs/design.md, web/README.md, web/ARCHITECTURE.md, web/COPY.md all synced.

Grounded in a 5-probe Playwright study of `claude.ai/design` driven autonomously after one manual login. Observations + design docs were at `.session-state/` — gitignored, intentionally not committed.

### 2. Production infrastructure for the live site

Done in the same session, post-merge:

- **`proveit.tools` purchased** on GoDaddy (£11 first year, £41/yr renewal). Independent of Roami brand — kept ProveIt's identity separable.
- **Vercel domains attached** to project `proveit-web` — apex serves the app, `www` 308-redirects via Vercel API.
- **DNS at GoDaddy** — A `@` and A `www` both point at Vercel `76.76.21.21`. SSL auto-provisioned. Domain was confused mid-session (parking IPs + a swapped CNAME) — fixed by deleting the broken row and adding a clean A record for `www`.
- **Resend domain verified** for `proveit.tools` via Domain Connect OAuth (DKIM at apex, SPF/MX at `send.proveit.tools` subdomain).
- **`WAITLIST_FROM_EMAIL=hello@proveit.tools`** set in Vercel production env, redeployed.
- **End-to-end smoke test passed** — POST /api/waitlist → 200 → email arrived in `cla1re@me.com` with correct From, Reply-To, Supabase dashboard link, and proper formatting.

### 3. Monetisation test design captured (NOT built)

Mid-session, the question of "how does the web app's design-bundle handoff work" forced a deferred strategic decision. Captured a concrete experiment design as a comment on [issue #20](https://github.com/cla1redonald/proveit/issues/20#issuecomment-4415247134):

- One product (the 5–7 file ProveIt Bundle, emailed via Resend)
- One price tier (Claire to set — gut £19–£29, needs proper analysis)
- One trigger (end of Full Validation, replacing the current waitlist email-capture)
- One delivery (Stripe payment link → success webhook → Resend → Supabase order row)
- One metric (conversion rate of completed Full Validations → paid bundle)

**This was opportunistic shaping, not a strategic decision.** Captured to protect it; deferred deliberately so it doesn't conflate with the v3.5 ship. Now Claire wants to step back and think about monetisation properly, with this paid-bundle idea as one option among several — not the answer.

### 4. Memory graduated this session

Three patterns landed via @retro into persistent memory:

- **Expert framework**: *Observation-first before drafting integrations.* The 5-probe study of claude.ai/design surfaced affordances (Handoff-to-Claude-Code button, Design Systems tab, verifier subagent) that priors alone would have missed. (`memory/shared/expert-frameworks.md`)
- **Common mistake**: *Framing a missing capability as a constraint without checking direction.* The Q6 reframe — "no API → still works because the bridge runs canvas → Code, not the reverse" — flipped the entire Phase 10 copy from apology to confidence. Detection rule: hedging copy ("since we can't programmatically...") in any deliverable is a tell. (`memory/shared/common-mistakes.md`)
- **Common mistake**: *Conditional-branch asymmetry in paired outputs.* Output 4 had `contextType: existing` guidance; Output 5 didn't. Reviewer caught it; should have been visible during drafting. Detection rule: when adding paired/symmetric structures, walk one concern across every paired item. (`memory/shared/common-mistakes.md`)

---

## Current State

- **Branch:** `main`. v3.5.0 + post-ship docs + handoff refresh all on main. Working tree clean.
- **Last commit:** `bb6cdd9` — `docs(handoff): refresh after evening domain + Resend setup`
- **Latest GitHub release:** [v3.5.0](https://github.com/cla1redonald/proveit/releases/tag/v3.5.0)
- **Production deploy:** **[proveit.tools](https://proveit.tools)** (primary). `www.proveit.tools` 308-redirects to apex. Old `proveit-web-zeta.vercel.app` remains a working alias.
- **Tests:** 230/230 passing in `web/`. Plugin agent prompts have no automated tests (markdown specs only).
- **Lint / typecheck / build:** all clean.
- **Open PRs:** 0.
- **Open GitHub issues:** 3 — #20 (GTM/monetisation strategy — *primary next-session focus*), #21 (web product roadmap, blocked on #20), #22 (Tier 2 + Tier 3 abuse prevention, deferred).
- **Domain:** `proveit.tools` (GoDaddy) — DNS at GoDaddy, two A records pointing at Vercel.
- **Vercel env vars (production):** `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DAILY_SPEND_CEILING_USD=1`, `PER_IP_DAILY_CEILING_USD=1`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `WAITLIST_NOTIFY_EMAIL=cla1re@me.com`, `WAITLIST_FROM_EMAIL=hello@proveit.tools`.
- **Supabase project:** `proveit-web` (`bbpdicijaqoujnpidiho`), eu-west-2.
- **Resend account:** `proveit.tools` domain verified. `hello@proveit.tools` confirmed sending end-to-end.
- **Lenny MCP:** installed at user scope. Active in any new Claude Code session.
- **Playwright MCP:** installed today; available for any future hands-on UI work.
- **Vercel MCP plugin:** active — runtime logs, deployment listings, domain checks without leaving the session.

---

## Open Issues

### Strategic — primary

**#20 — Monetisation strategy unresolved.** A concrete £19–£29 paid-bundle test was scoped this session ([comment](https://github.com/cla1redonald/proveit/issues/20#issuecomment-4415247134)) but treating that as the answer would skip the strategic question. Worth properly exploring before building. Dimensions to surface in the exploration:

- **Pricing models** — one-off bundle / subscription / freemium / token-credits / licensing (per validation, per company, per seat)
- **Audience segments** — PMs at small co vs big tech vs solo founders vs agencies vs internal-tools teams; willingness-to-pay differs by 5–10× across these
- **Distribution channels** — web direct (current) vs Claude Code plugin marketplace vs B2B sales-led vs partnership / embedded in PM tooling (Linear, Productboard, etc.)
- **Test methodologies** — price-point A/B vs Wizard of Oz vs van Westendorp pricing interviews vs landing-page funnel test vs paid-pilot programme. Different methods give different fidelity at different costs.
- **Multi-experiment vs single-experiment** — should we test 2–3 monetisation surfaces in parallel rather than committing to one?

The captured comment is one input, not the answer.

### Build / housekeeping (not blocking)

- Delete the Supabase smoke-test row from today: email `claude-smoke-test+2026-05-10@proveit.tools` in the `waitlist` table. [Supabase dashboard](https://supabase.com/dashboard/project/bbpdicijaqoujnpidiho/editor).
- Confirm `cla1re@me.com` is the right long-term notification address. Currently set in `WAITLIST_NOTIFY_EMAIL` Vercel env. Was deliberate (typo'd address for spam isolation) but worth re-checking for the post-#20 paid-bundle world where order receipts and customer support are at stake.
- `agents/proveit.md` is now ~2150 lines after v3.5. Multi-file split is a candidate refactor but not urgent.
- Tier 2 abuse prevention (#22) remains deferred until Tier 1 ceilings start tripping.

### Files / locations worth knowing

| What | Where |
|---|---|
| Plugin agent definition | `agents/proveit.md` — 2150 lines, single file (split candidate) |
| Web app | `web/` — Next.js App Router, 230 tests, deployed to proveit.tools |
| Validation results UI | `web/src/components/validate/ChatInterface.tsx` (FullBundlePointer wired here) + `web/src/components/validate/FullBundlePointer.tsx` |
| Email/notification flow | `web/src/lib/notifications.ts` + `web/src/app/api/waitlist/route.ts` |
| Strategic exploration directory | `~/code/proveit-strategy/` — separate working dir, has its own HANDOFF.md, set up specifically to run `/proveit` on strategic questions about ProveIt itself |
| Memory graduations | `memory/shared/expert-frameworks.md`, `memory/shared/common-mistakes.md`, `memory/agent/proveit.md` |

---

## Resume Prompt

Pick a focus from below (or your own), then in a fresh Claude Code session:

```bash
cd ~/code/proveit-strategy   # for Option A (recommended)
# OR
cd ~/code/proveit             # for Options B–E

claude
```

Paste this — edit the focus line for whichever thread you want, delete the others:

```
/preflight

Then: read HANDOFF.md in this directory. The focus this session is [PICK ONE]:

  Option A — (RECOMMENDED) Properly explore ProveIt's monetisation strategy.
             Run /proveit on "ProveIt monetisation strategy — explore the
             options before committing to a test." Treat the captured
             £19-£29 paid-bundle idea (issue #20 comment) as ONE INPUT, not
             the answer. Make sure the exploration covers: pricing models
             (one-off vs subscription vs freemium vs credits vs licensing),
             audience segments (small-co PMs vs big-tech PMs vs solo
             founders vs agencies — wtp varies 5-10×), distribution
             channels (web direct vs Claude Code marketplace vs B2B),
             test methodologies (A/B vs Wizard of Oz vs van Westendorp
             vs landing page funnel vs paid pilot), and whether to run
             multiple parallel experiments. Output a recommendation that
             closes issue #20 with a decision, OR concludes #20 needs
             further validation work first. Run from ~/code/proveit-strategy/
             not the main proveit/ directory.

  Option B — (downstream of A) Build the monetisation test once the
             strategic exploration in Option A converges. The captured
             £19-£29 bundle design is at issue #20 comment 4415247134 and
             is ready to build if the exploration validates it. Branch
             feat/proveit-bundle-paywall, work in ~/code/proveit/.
             Required env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
             Adds an "orders" table to Supabase. Replaces the existing
             FullBundlePointer with a paid CTA + CLI fallback.

  Option C — Run /proveit on the Wedding Speech Roaster idea against
             v3.5 plugin (now with design-brief.md and claude-design-prompts.md).
             Surfaces whether the two new design outputs feel coherent
             and whether prompt slots resolve cleanly from real discovery.

  Option D — Plugin file split: agents/proveit.md is 2150 lines after v3.5.
             Confirm whether Claude Code's plugin model supports a
             multi-file split with agents/proveit.md as an index, then
             refactor.

  Option E — Tier 2 abuse prevention. Issue #22. Useful only if Tier 1
             ceilings start tripping in real usage — no signal yet.

Trivial cleanups while you're in there (~5 min):
- Delete the Supabase smoke-test row claude-smoke-test+2026-05-10@proveit.tools
- Sanity check WAITLIST_NOTIFY_EMAIL=cla1re@me.com is still the right address
```

End-of-session expectation: a clear recommendation closing or further-shaping #20 (for Option A), or a release for whatever ships (other options), plus an updated HANDOFF.md.
