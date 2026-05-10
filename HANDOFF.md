# Session Handoff — 2026-05-10 (afternoon)

**Recommended next focus:** Claude Design (claude.ai/design canvas) integration with ProveIt — the primary unfinished thread from the morning. Multiple alternatives listed below if you want to pivot.

---

## Session Summary — 8 releases shipped today

A long, productive session across the plugin and the web app. In chronological order:

1. **v3.0 (`81ae8c9`, `a1728b4`, `70cf74e`)** — Agent maturation pass. 17 named expert frameworks embedded, [`lenny-mcp`](https://github.com/akshayvkt/lenny-mcp) integrated as runtime tool, Phase 6.5 Pre-Mortem & Kill Criteria (Annie Duke / Shreyas Doshi anchored), Output 3 (`spec.md` engineering PRD), claude.ai/design manual handoff in Phase 10.
2. **v3.1.0 (`40c7938`)** — Three new swarm agents: Defensibility / Moat (default, Hamilton Helmer's *7 Powers*), AI Commoditization, Regulatory. Swarm now opt-out up to 10 agents. Adaptive Fast Check 7-category catalog. Phase 6.7 Wave 3 — Scenario & Experiment.
3. **v3.2.0 (`7066486`)** — Phase 0 Intake before Brain Dump (context type + prior context). BrandIt now truly conditional. Brand / Claude Design / Gamma boundary table documented.
4. **v3.2.1 (`589faa4`, `43af17a`)** — Web app methodology brought in sync with plugin v3.2 at the prompt layer.
5. **v3.3.0 (`f83c70a`)** — **Tier 1 abuse prevention.** Server-side daily spend ledger + circuit breaker. Two ceilings — global daily ($1 in production) and per-IP daily ($1). 503 with friendly "portfolio piece — capped" message when breached.
6. **v3.4.0 (`170ec3f`)** — **Email-capture waitlist** when spend cap fires. Inline form, posts to `/api/waitlist`, lands in Supabase (`proveit-web` project, `bbpdicijaqoujnpidiho`). RLS enabled, anon key INSERT-only.
7. **v3.4.1 (`654babb`)** — **Real-time email notifications** for waitlist signups via Resend. Notification email lands at `cla1re@me.com` with Reply-To set to the submitter for one-click responses. **Verified end-to-end** — test email arrived in your inbox.
8. **Rate-limit tighten (`182a98e`)** — Chat rate limit dropped from 20/min to 5/min per IP. The per-min and per-day caps now layer sensibly.

**Browser-verified via Playwright (this morning):**
- Fast Check on a regulated AI idea correctly picked **Regulatory + Desirability + Viability** (not D/V/C) with cited UK GDPR / ICO / NSPCC / NHS Digital sources
- Full Validation on an iteration idea correctly fetched the parent URL via `web_search` in `brain_dump`, summarised it, adapted questions to iteration framing

**End-to-end verified (this afternoon):**
- Form submit → Supabase row → Resend send → email lands at `cla1re@me.com`
- Reply-To pointing at submitter so single-click responses just work

---

## Current State

- **Branch:** `main`. All commits pushed. Working tree clean.
- **Last commit:** `182a98e` — `fix(web): tighten chat rate limit from 20/min to 5/min per IP`
- **Latest GitHub release:** [v3.4.1](https://github.com/cla1redonald/proveit/releases/tag/v3.4.1)
- **Production deploy:** [proveit-web-zeta.vercel.app](https://proveit-web-zeta.vercel.app) — Ready, smoke-tested + email-tested end-to-end.
- **Tests:** **227/227** passing in `web/`. Plugin agent prompts have no automated tests (markdown specs only).
- **Lint / typecheck / build:** all clean.
- **Open PRs:** 0
- **Open GitHub issues:** 3 — #20 (GTM/monetisation strategy, blocking), #21 (web product roadmap, blocked on #20), #22 (Tier 2 + Tier 3 abuse prevention, deferred).
- **Vercel env vars in production:** `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DAILY_SPEND_CEILING_USD=1`, `PER_IP_DAILY_CEILING_USD=1`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY` (new account), `WAITLIST_NOTIFY_EMAIL=cla1re@me.com`.
- **Supabase project:** `proveit-web` (`bbpdicijaqoujnpidiho`), eu-west-2, free tier. Read the waitlist via the [Supabase dashboard](https://supabase.com/dashboard/project/bbpdicijaqoujnpidiho/editor).
- **Resend account:** registered to your `me.com` address; sending from `onboarding@resend.dev` (sandbox). Domain verification still pending — see "Housekeeping" below.
- **Lenny MCP:** installed at user scope. Active in any new Claude Code session.

---

## Defence-in-depth currently protecting the live URL

| Layer | What it stops |
|---|---|
| `x-real-ip` IP detection | Spoofed `x-forwarded-for` headers |
| Per-IP rate limit (chat 5/min, fast 10/min) | Single-machine bursts |
| Per-IP daily spend ceiling ($1) | Sustained single-user abuse |
| Global daily spend ceiling ($1) | Viral distribution / aggregate abuse |
| 90s app-level Anthropic timeout | Hung streams burning credits |
| `text/event-stream` + `no-transform` headers | CDN buffering breaking streaming |
| `server-only` import guards | Anthropic key reaching client bundle |
| Supabase RLS + anon-INSERT-only policy | Unauthorised reads of the waitlist |
| Email capture form on 503 | Lost portfolio-interest signal at the friction moment |
| Real-time Resend notification | You finding out about signups days later |

---

## Pending threads (pick one for the next session)

### A — Claude Design integration (recommended, primary thread)

The morning's handoff focus. Six concrete open questions documented in the previous version of this file's "Questions to explore" section, all still relevant:

1. What does the claude.ai/design canvas actually do well? Try it manually first.
2. Could ProveIt produce a *design brief* artefact alongside Gamma deck and `spec.md`?
3. Phase 7.5 Design Handoff as a proper phase, or stay as Phase 10 next-step?
4. How does it work for `contextType: existing` sessions?
5. Web app side — equivalent handoff for the lighter web flow?
6. Does claude.ai/design have an API / MCP for programmatic invocation?

Suggested approach: **15-20 min of manual exploration first**, then design the integration based on what you actually see. Don't design for assumed capabilities.

### B — Strategic validation: paid product vs portfolio piece

This is **the load-bearing strategic decision** that's been deferred all week. Tracked as Todoist task `6gc9RjXVxFMFFwJG` (p3) and GitHub issue #20. Without it, infra and product roadmap decisions stay theoretical. The infrastructure is now solid enough (v3.0 → v3.4.1) that the validation itself can happen on solid ground.

To run: open `~/code/proveit-strategy/` (separate working dir already set up with its own HANDOFF.md), run `/proveit` against the framing "ProveIt — paid product vs portfolio piece, validate both paths and tell me which has stronger evidence".

### C — Run ProveIt v3.2 against a real idea (Wedding Speech Roaster)

The matured plugin (v3.2 — Phase 0, 10-agent swarm, Pre-Mortem, Wave 3, etc.) hasn't been exercised against a real idea since the changes shipped. The Wedding Speech Roaster validation queued in Todoist `6gc9RjXVxFMFFwJG` was the natural first run. Will surface whether:
- The 10-agent opt-out swarm produces useful output
- Phase 6.5 Pre-Mortem produces 3 specific bets with calendar kill dates (or stays vague)
- Wave 3 produces paste-ready artefacts (or templates)
- Lenny MCP is actually called by subagents during research

### D — Tier 2 abuse prevention (only if signals warrant)

Issue #22 captures the full design. Useful only if Tier 1 ceilings start tripping in real usage (no signal yet — the live URL has been quiet). Tier 1 ($1 global / $1 per-IP) gives strong protection already.

### E — Verify a domain in Resend (small housekeeping)

Currently sending notifications from `onboarding@resend.dev` (sandbox). Add domain verification at [resend.com/domains](https://resend.com/domains), drop TXT + DKIM CNAME into DNS, set `WAITLIST_FROM_EMAIL=noreply@yourdomain.com` in Vercel. ~10 min if you have DNS access. Lifts the sandbox restriction so you can also email submitters back from your own domain.

### F — Plugin file split

`agents/proveit.md` is now ~1900 lines. Still readable but at this size worth considering a multi-file split: `agents/proveit/00-intake.md`, `agents/proveit/05-deep-dive.md`, etc., with `agents/proveit.md` as an index. Need to confirm Claude Code's plugin model supports the split before refactoring.

---

## Resume Prompt

Pick a focus from above (or your own), then in a fresh Claude Code session:

```bash
cd ~/code/proveit
claude
```

Paste this — edit the focus line for whichever thread you want:

```
/preflight

Then: read HANDOFF.md in this directory. The focus this session is [PICK ONE]:

  Option A — Claude Design integration: explore how to use claude.ai/design canvas
             better and more for ProveIt. Open it manually first for 15-20 min on a
             real idea, build a current mental model of what it does well, then
             design the integration based on what you actually see. Read the
             Brand / Claude Design / Gamma boundary table in agents/proveit.md
             around Phase 7 and Phase 10 first so we don't relitigate what's decided.

  Option B — Strategic validation in ~/code/proveit-strategy/: paid product vs
             portfolio piece. Open that directory's HANDOFF.md for full context.
             This unblocks GitHub issues #20 and #21.

  Option C — Run /proveit on the Wedding Speech Roaster idea to test the matured
             v3.2 plugin (Phase 0 + opt-out 10-agent swarm + Pre-Mortem + Wave 3)
             against a real idea. Surfaces whether the prompt structure produces
             useful output or needs another pass.

  Option D — Verify roami.group (or another domain) in Resend so notification
             emails can come from a real domain instead of the sandbox.

  Option E — Plugin file split: agents/proveit.md is 1900 lines. Confirm whether
             Claude Code's plugin model supports a multi-file split with
             agents/proveit.md as an index, then refactor.

Plugin-side improvements are fine to ship. Anything that becomes web-app-product
work stays gated on #20 (the strategic decision in option B).

Active todos worth knowing about:
- Validate ProveIt's path: paid vs portfolio (Todoist 6gc9RjXVxFMFFwJG, p3)
- v3.2 plugin test run on Wedding Speech Roaster
- Tier 2 abuse prevention captured in issue #22 if v3.3 ceilings start tripping
- Resend domain verification (cosmetic; sandbox works for now)

End-of-session expectation: a release for whatever ships, plus an updated HANDOFF.md
that captures what landed and what the next-next focus should be.
```

Pick a single option and delete the others before you paste — keeps the session focused.
