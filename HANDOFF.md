# Session Handoff — 2026-05-22 (portfolio refresh)

**Recommended next focus:** Pre-launch epic #24 is **complete**. Last remaining pre-launch task is **#43 rotate `ANTHROPIC_API_KEY`** (~5 min). After that: write Substack Post #1 and run the WoZ friend-cohort outreach (the day-30 kill criteria clock starts on first post).

For PR / marketing agents reading this from outside the engineering context: read `docs/BRIEF.md` instead.

---

## What changed since the last handoff (2026-05-10)

Pre-launch epic #24 closed out across two pushes (10 May + 17 May). All five original pre-launch stories shipped:

| # | Title | Closed |
|---|---|---|
| #28 | Raise `DAILY_SPEND_CEILING_USD` 1→5 | 2026-05-10 |
| #29 | Add analytics (PostHog) | 2026-05-10 |
| #30 | Replace `FullBundlePointer` with WoZ email-capture CTA | 2026-05-17 |
| #41 | Mobile streaming verification | 2026-05-17 |
| #42 | Sentry / error tracking | 2026-05-17 |
| #47 | Mobile score panel reading order bug | 2026-05-17 |

Plus shareability story #31 ("Made with ProveIt" Gamma watermark, PR #52) shipped 2026-05-17.

Docs hygiene (today, 2026-05-22): fixed stale `proveit-web-zeta.vercel.app` links in `README.md` and `web/README.md` — both now point at `proveit.tools`.

---

## Current State

- **Branch:** `main`. Working tree clean.
- **Last commit:** `e3705c7` — `feat: add 'Made with ProveIt' watermark to Gamma decks (#31) (#52)`
- **Production deploy:** **[proveit.tools](https://proveit.tools)** — homepage 200, `/validate` 200, `/api/waitlist` validates correctly. PostHog instrumentation live. CSP headers active.
- **Tests:** **243/243 passing** in `web/` (22 files). Plugin agent prompts have no automated tests (markdown specs only).
- **Lint / typecheck / build:** all clean. Sourcemaps upload to PostHog on every build.
- **Open PRs:** 0
- **Open GitHub issues:** 16 total (all backlog by design — Project #4):
  - 4 epics (#24 effectively done, #25 partial, #26, #27)
  - 9 stories (#22 deferred, #32, #33, #34–37, #38, #39, #40, #43, #44)
  - **Only true pre-launch remaining:** #43 (rotate ANTHROPIC_API_KEY)
- **Plugin:** `agents/proveit.md` is **1895 lines** (down from 2150 — already trimmed). 4 commands: `/proveit`, `/proveit:proveit-fast`, `/proveit:proveit-dashboard`, `/proveit:proveit-retro`.
- **Domain:** `proveit.tools` (GoDaddy registrar + DNS).
- **Vercel env vars (production):** `ANTHROPIC_API_KEY` (needs rotation per #43), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DAILY_SPEND_CEILING_USD=5`, `PER_IP_DAILY_CEILING_USD=1`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `WAITLIST_NOTIFY_EMAIL=cla1re@me.com`, `WAITLIST_FROM_EMAIL=hello@proveit.tools`, plus PostHog + Sentry keys.
- **Supabase project:** `proveit-web` (`bbpdicijaqoujnpidiho`), eu-west-2.
- **Resend:** `proveit.tools` verified, `hello@proveit.tools` sending end-to-end.

---

## Open Issues

### Strategic — answered

The big strategic question (#20 GTM/monetisation) is **answered and committed**. Key documents:

- `docs/STRATEGY.md` — load-bearing strategy doc. Audience, pricing, free/paid line, differentiators, 90-day GTM motion. Read first.
- `docs/strategy-pre-mortem.md` — kill criteria contract. Annie Duke pre-commit. Three numbers all must hit by day 30. **Re-read before the day-30 review.**

Full reasoning trail (gitignored, session-only): `~/code/proveit-strategy/{discovery,research-1,swarm-1-*,swarm-1-synthesis,pre-mortem-1}.md`

### Backlog — Project #4

**Pre-launch remaining (epic #24 — last item):**
- #43 — Rotate `ANTHROPIC_API_KEY` (currently from closed `claired@moo.com` account) — ~5 min

**Shareability (epic #25 — partial, parallel to launch content):**
- #32 — D/V/F score share card with OG meta
- #33 — Kill-signal screen designed for screenshot-shareability

**Monetisation infrastructure (epic #26, gated on WoZ):**
- #34 — Stripe Checkout one-off £4.99 (only build if WoZ converts)
- #35 — Resend bundle delivery email
- #36 — Supabase `orders` table
- #37 — Stripe Checkout subscription £9.99/mo (month-2)
- #40 — Server-side Gamma deck generation (bundle requires the deck)

**Moat maintenance (epic #27, month-2):**
- #38 — Miro board output artefact
- #39 — Notion page output artefact

**Housekeeping stories:**
- #44 — Rotate `OPENAI_API_KEY` (local plugin use, lower urgency)
- #22 — Tier 2/3 abuse prevention (deferred per strategy)

### Known issues / housekeeping

- **`docs/design.md`** is dated 2026-05-10 (v3.5.0). Accurate but predates watermark PR #52. Refresh when convenient.
- **One Supabase row to delete:** `claude-smoke-test+2026-05-10@proveit.tools` in `waitlist` table. [Supabase dashboard](https://supabase.com/dashboard/project/bbpdicijaqoujnpidiho/editor).

### What this strategy explicitly does NOT do

(For future sessions tempted to relitigate — these are deliberate scope decisions, not open questions):

- Does NOT build for Tier C (org sales) in 30 days
- Does NOT optimise for revenue (cost-cover floor only; bonus above)
- Does NOT chase virality
- Does NOT enable Substack paid tier in month 1
- Does NOT pursue speaking, podcasts, or courses in month 1 (inbound only)
- Does NOT commit to writing past Post #3 unless kill criteria hit
- Does NOT ship Miro/Notion integrations in month 1 (epic #27 is month-2 work)
- **Does NOT add user accounts / auth** — `STRATEGY.md` is explicit: "no login on either side." Load-bearing.

---

## Resume Prompt

```bash
cd ~/code/proveit
claude
```

Paste:

```
/preflight

Then: read docs/STRATEGY.md → docs/strategy-pre-mortem.md → HANDOFF.md →
Project #4 (https://github.com/users/cla1redonald/projects/4).

Focus this session [PICK ONE]:

  Option A — (RECOMMENDED) Close out the last pre-launch item then ship
             the launch:
             1. #43 — Rotate ANTHROPIC_API_KEY (~5 min)
             2. Write Substack Post #1 (the load-bearing artefact).
                Headline candidate: "What ChatGPT won't tell you about
                your product idea." See docs/STRATEGY.md §"What
                Substack post #1 says" for the structural brief.
             3. Wire up friend-cohort outreach (5–10 PM-adjacent friends,
                personal DMs, ask which payment option they'd pick).
                See pre-mortem-1.md "Bet 4."

  Option B — Shareability epic #25 stories (#32 OG share card, #33 kill-
             signal screen). Useful once Post #1 is out and traffic
             arrives — design these to be screenshot-friendly.

  Option C — Plugin file split: agents/proveit.md is 1895 lines. Confirm
             Claude Code's plugin model supports multi-file split with
             agents/proveit.md as index, then refactor. Not urgent.

  Option D — Refresh docs/design.md to v3.6 (incorporates watermark PR #52
             + WoZ CTA #30). Not urgent.

The day-30 launch review is on June 10, 2026 (counting from first
Substack post). Re-read docs/strategy-pre-mortem.md COLD before that
review, then read the data. DO NOT relitigate the strategic decision
in #20 — it is committed and falsifiable. Execute, measure, honour
the kill criteria.

Trivial cleanup while you're in there (~2 min):
- Delete Supabase row claude-smoke-test+2026-05-10@proveit.tools
```

End-of-session expectation: a release for whatever ships, plus an updated HANDOFF.md.

---

## For PR / marketing agents reading this

This is the engineering / next-Claude-session handoff. The PR / marketing-facing brief lives at **`docs/BRIEF.md`** — single-page summary of audience, positioning, voice, narrative spine, do's / don'ts, key dates. Start there if you're shaping copy or campaigns.
