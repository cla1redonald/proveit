# Session Handoff — 2026-07-09 (BrandIt removal + share-readiness)

_Supersedes the 2026-06-23 Stripe go-live handoff (see git history for the full Stripe resume detail)._

## Session Summary

1. **BrandIt removed from ProveIt — PR #72, squash-merged to main.** Mid-session discovery: this machine's checkout was a stale 2026-05-01 WIP branch while `origin/main` had advanced to v3.5+/3.7 (Stripe, ProveIt Studio, frontier-scan). The removal was redone against current main in a worktree: Phase 7 (Brand Identity) deleted from `agents/proveit.md`, phases renumbered (0–6.7, 7 Final Review, 8 Outputs, 9 Next Steps), brand context rerouted to `## Inherited assets` / `design-brief.md` § Brand reference, logos handled by Claude Design's "Logos" prompt, web app + memory files + `.env.example` cleaned, historical specs/plans given supersession banners, `docs/design.md` bumped to v3.8.0. A reviewer agent audited the diff; its 3 findings were fixed before merge. 303 web tests pass.
2. **ShipIt linkage assessed and kept** — all references updated to [ShipIt V4](https://github.com/cla1redonald/shipit-v4) with repo link. Caveat: `/orchestrate` is V1–V3 roster; if V4 retires it, only Phase 9 + the README pipeline section need updating.
3. **README architectural one-liner added — PR #73 merged.** ProveIt is now explicitly positioned as a validation *harness* (one Opus agent + phased methodology + disposable Sonnet swarm + cross-model review), not a suite of agents.
4. **Stale `wip-claire-handoff-2026-05-01` branch deleted** (local + origin) — its backup commit carried browser console logs and Playwright screenshots, now unreachable.
5. **Share-readiness scan (repo is PUBLIC):** no secrets in the working tree or the full git history (all 136 commits, all branches); `.env` never committed; emails in tree are deliberate contact addresses. Verdict: safe to share.
6. **Live app health check (proveit.tools):** all key routes 200, zero runtime errors in 7 days, checkout 503s → WoZ email-capture fallback because the two Stripe/Supabase secrets were never added to Vercel prod. Deliberate recommendation: leave payments off while sharing — Stripe is in TEST mode, so enabling it would decline real cards; the WoZ fallback is the better experience and PostHog `checkout_initiated` is the demand signal.
7. **Global Claude settings tidy** (`~/.claude/settings.json`): removed a plaintext Turso auth token from the Bash allowlist, removed a stale `~/brandit` allow rule, switched `teammateMode` tmux→auto, confirmed `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

## Current State

- **Branch:** `main`, clean, in sync with origin. Last commits: `54cfd40` (README one-liner, #73) on top of the PR #72 squash.
- **Tests:** `web/` — 303 passing, 28 files (last run this session).
- **Deploy:** proveit.tools live and healthy; paid path inert by design (503 → WoZ).
- **No failing tests or lint errors known.**

## Open Issues

1. **Rotate the Turso token** (Claire) — it sat in plaintext in `~/.claude/settings.json`; the rule is removed but the token should be rotated (`turso db tokens` or dashboard). Project: roami.help, not ProveIt.
2. **Stripe go-live still pending** — `STRIPE_SECRET_KEY` + `SUPABASE_SERVICE_ROLE_KEY` in Vercel prod (interactive `vercel env add`, values never through chat), redeploy, test-card end-to-end, then live keys + live webhook. Full runbook: 2026-06-23 HANDOFF.md in git history.
3. **Stale API key issues #43 / #44** (GitHub) — confirm dead and close (Claire).
4. **Fresh plugin install unverified** — the fixed marketplace.json format has not been exercised by a clean `setup.sh` run (carried over).

## Resume Prompt

```
I'm continuing work on ProveIt (~/code/proveit, branch main — pull first). Last session
(2026-07-09): removed BrandIt entirely (PR #72, phases renumbered to 0–6.7/7/8/9,
design.md v3.8.0), updated ShipIt refs to V4, added the "validation harness" positioning
line to the README (PR #73), deleted the stale wip-claire-handoff branch, verified the
public repo is secret-free, and confirmed proveit.tools is healthy with payments
deliberately inert (503 → WoZ; Stripe is TEST mode — don't enable before going properly live).

Open: rotate Turso token (done? check), Stripe go-live runbook (2026-06-23 HANDOFF in git
history), close stale-key issues #43/#44, verify a fresh plugin install.

Start by reading HANDOFF.md.
```
