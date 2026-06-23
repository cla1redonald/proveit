# Session Handoff — ProveIt paid-bundle (Stripe go-live in progress)

_Last updated: 2026-06-23. Supersedes the 2026-05-22 portfolio-refresh handoff (see git history)._

## Session Summary

Built and shipped the **entire automated paid-bundle feature** for ProveIt, replacing the manual Wizard-of-Oz, then started the Stripe go-live. All code is merged to `main`:

- **Phase 1 (PR #65)** — real Stripe one-off Checkout (£4.99), `orders` table, signature-verified + fail-closed webhook. 503→WoZ fallback until keys exist.
- **Phase 2+3 (PR #66)** — server-side fulfilment: one bounded Haiku call composes findings/recommendations/artifacts; text artifacts emailed; a branded **`/html-deck`** deck rendered (Roami palette), stored in a private Supabase `decks` bucket, served at `/deck/<id>`, link emailed. Deck reviewed slide-by-slide; cover was dark-on-dark and was fixed.
- **Phase 4 (PR #67)** — `markOrderPaid` made atomic (`update … where status='pending'`) to close a double-webhook race.
- Also fixed ProveIt's own `docs-check` to cover `web/src` (was a silent no-op on the app), via PR #64.

(Broader context: the same session did extensive **ShipIt V4** work — P3 specialist-nudge, P4/P5 battle-testing on FocusBoard/ProveIt/roami-hobbies, the autonomous session-end sweep, gate fixes, `install-gates --update`, worktree support — all merged to `shipit-v4` main. Not needed to resume ProveIt.)

## Current State

- **Repo/branch:** `~/code/proveit`, `main`, clean. Last feature commit: Phase 4 atomic `markOrderPaid` (#67).
- **Tests/build:** 303 tests passing, typecheck + build clean (as of last run).
- **Deploy:** `proveit.tools` live and healthy. The paid path is **inert until the 2 secrets below are set + a redeploy** — so prod is NOT broken (checkout returns 503 → UI falls back to the WoZ modal).
- **Stripe (TEST mode, account "Roami Ltd" `acct_1TghdCRre4tAAiCH`):**
  - Product `prod_UgYzn4nI51Wn4v` "ProveIt Validation Bundle"
  - Price `price_1ThBs6Rre4tAAiCHWxZixtD9` — £4.99 GBP, `one_time`
  - Webhook endpoint `we_1ThBt3Rre4tAAiCHqiXsgGCB` → `https://proveit.tools/api/stripe/webhook`, event `checkout.session.completed`
  - Stripe CLI installed + authed (key expires ~90 days).
- **Vercel `proveit-web` production env:** ✅ `STRIPE_PRICE_ID`, ✅ `STRIPE_WEBHOOK_SECRET` (piped from a local file, never printed). ⏳ **PENDING:** `STRIPE_SECRET_KEY` + `SUPABASE_SERVICE_ROLE_KEY`.
- **Supabase `proveit-web` (`bbpdicijaqoujnpidiho`):** `orders` table (RLS: anon insert pending only; service-role for paid writes) and private `decks` Storage bucket both created.

## Open Issues

1. **Stripe go-live — 2 env secrets pending (Claire to add).** Interactive prompt, value stays local:
   ```
   cd ~/code/proveit/web && vercel env add STRIPE_SECRET_KEY production         # sk_test_… (test mode)
   cd ~/code/proveit/web && vercel env add SUPABASE_SERVICE_ROLE_KEY production # Supabase → proveit-web → Settings → API → service_role
   ```
   Then **redeploy production** (env changes only apply to a new deploy) and run a **test-card** end-to-end.
2. **Supabase CLI mis-linked (footgun):** the proveit repo's CLI is linked to *FocusBoard's* project (`pqjzwyrhcqczplrubfqs`). The orders/decks migrations were applied to the *correct* project (`bbpdicijaqoujnpidiho`) via the Supabase MCP, but before any `supabase db push` run `supabase link --project-ref bbpdicijaqoujnpidiho`. (`supabase/.temp/` is now gitignored.)
3. **Two stale API keys still open** (GitHub issues #43 `ANTHROPIC_API_KEY`, #44 `OPENAI_API_KEY`) from closed/old accounts — security, Claire's action.
4. **Preview note:** the standalone `web/scripts/render-deck-preview.mjs` was removed (it duplicated `template.ts`). `/dev/deck-preview` (dev-only route) is the canonical real-code deck preview.
5. **Live launch (later):** flip to `sk_live_…` + a separate **live-mode** webhook endpoint + its own `STRIPE_WEBHOOK_SECRET`; then watch `checkout_initiated` (PostHog) as the demand signal that replaces the WoZ.

## Resume Prompt

```
Resume ProveIt's Stripe go-live (TEST mode). Code is all merged on main (~/code/proveit).
State: Stripe CLI authed (Roami Ltd); price price_1ThBs6Rre4tAAiCHWxZixtD9 (£4.99 GBP one-off);
webhook we_1ThBt3Rre4tAAiCHqiXsgGCB → proveit.tools/api/stripe/webhook (checkout.session.completed);
Vercel proveit-web prod has STRIPE_PRICE_ID + STRIPE_WEBHOOK_SECRET. orders table + private decks
bucket exist in Supabase bbpdicijaqoujnpidiho.

1. Confirm Claire added STRIPE_SECRET_KEY (sk_test_) + SUPABASE_SERVICE_ROLE_KEY to Vercel prod
   (vercel env ls production). If missing, give her the two `vercel env add` commands.
2. Redeploy production so the env applies: `cd ~/code/proveit/web && vercel deploy --prod` (or redeploy latest).
3. End-to-end test (real run, not just config): do a test-mode checkout on proveit.tools with card
   4242 4242 4242 4242. Verify: an `orders` row goes pending→paid (Supabase), the artifacts email +
   deck-ready email send (Resend), the deck renders at proveit.tools/deck/<id>, and PostHog logs
   checkout_initiated + checkout_completed. Use `stripe trigger checkout.session.completed` and/or the
   Stripe dashboard test events + Supabase row checks to confirm.
4. Report what fired and anything broken. Secrets NEVER through chat (rule #3); use vercel env prompts.
Do not flip to live keys yet — test mode only until Claire says launch.
```
