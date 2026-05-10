# Gameplan: Spend Ledger + Circuit Breaker (Tier 1 Abuse Prevention)

**Spec:** none — working from session conversation; design fully agreed before plan
**Complexity:** Low–Medium
**Estimated files:** 7 changed/new
**Target release:** v3.3.0
**Working directory:** `/Users/clairedonald/code/proveit/`

## Goal

Cap blast radius of cost-spike abuse on the live web app (proveit-web-zeta.vercel.app). The site is shared as a portfolio piece; existing per-IP rate limiting handles single-machine abuse but does not stop viral distribution or VPN-rotation. Add a server-side daily Anthropic-spend ledger with two ceilings (global + per-IP). When breached, route handlers return a friendly 503. Fast Check stays open in the normal case.

Out of scope (deferred): email gate (Tier 2), proper auth + paid tiers (Tier 3) — capture as GitHub issue for later.

## Steps

1. **Create `web/src/lib/spend-ledger.ts`** (new file).
   Mirrors the structure of `web/src/lib/rate-limit.ts` for consistency:
   - `import "server-only"`
   - Imports `Redis` from `@upstash/redis` (already a dep)
   - Lazy-initialised Redis client (returns `null` if env vars absent → in-memory fallback for local dev only)
   - In-memory fallback `Map<string, number>` keyed by ledger key, suitable for `npm run dev` and unit tests
   - Public surface:
     - `estimateCost(endpoint: "fast" | "chat", phase?: DiscoveryPhase): number` — returns USD float. Fast = 0.10, chat without research = 0.05, chat in research phase = 0.50, brain_dump (now has web_search at max_uses 3) = 0.10. Numbers configurable via constants at top of file.
     - `interface SpendCheck { allowed: boolean; reason?: "global_cap" | "per_ip_cap"; globalSpendUsd: number; ipSpendUsd: number; globalCeilingUsd: number; ipCeilingUsd: number; }`
     - `checkSpend(ip: string, estimatedCost: number): Promise<SpendCheck>` — reads both counters, returns whether the call is allowed (does not increment). Allowed if `(globalSpend + estimatedCost) <= globalCeiling AND (ipSpend + estimatedCost) <= ipCeiling`.
     - `recordSpend(ip: string, actualCost: number): Promise<void>` — `INCRBYFLOAT` both keys; sets EXPIRE to 48h on first creation so old days auto-clean.
     - `resetSpendStores(): void` — for tests.
   - Ceilings read from env at call time (not module load) so changes don't require re-deploy: `Number(process.env.DAILY_SPEND_CEILING_USD || "5")` and `Number(process.env.PER_IP_DAILY_CEILING_USD || "1")`.
   - Today's date key: `proveit:spend:YYYY-MM-DD` (UTC) and `proveit:spend:YYYY-MM-DD:ip:<ip>`. UTC is fine — global app, daily granularity.
   - **Key design choice:** check-then-record. We check before processing; we record after success. Failed Anthropic calls don't count. This means a bursty 10 simultaneous requests could all pass the check and then all record — by design we accept this (the ceilings are soft/best-effort, not hard transactional caps).

2. **Wire into `web/src/app/api/fast/route.ts`**:
   - After existing rate-limit check, before zod parse: call `estimateCost("fast")`, then `checkSpend(ip, estimatedCost)`. If not allowed, return 503 with friendly JSON body and the helpful `Retry-After: 86400` header (seconds to next day's reset is a coarse approximation; OK).
   - After successful streaming completes: `recordSpend(ip, estimatedCost)` in the `finally` of the stream controller. Use a flag to ensure recording only on success path.

3. **Wire into `web/src/app/api/chat/route.ts`**:
   - Same pattern. `estimateCost("chat", phase)` so research-phase calls cost more in the ledger than brain_dump/discovery/findings calls. Reflects reality: research phase fires 9+ web searches.
   - Same check-then-record. Increment in stream `finally` on success.

4. **Tests** in `web/tests/unit/spend-ledger.test.ts` (new):
   - `estimateCost` returns expected values per endpoint+phase
   - `checkSpend` allows when under both ceilings; blocks with `reason: "global_cap"` when over global; blocks with `reason: "per_ip_cap"` when over per-IP only
   - `recordSpend` increments counters; subsequent `checkSpend` reflects the increment
   - In-memory fallback works when no Upstash env vars
   - `resetSpendStores` clears state between tests

5. **Integration tests** in `web/tests/integration/api-fast-edge-cases.test.ts` and `api-chat-edge-cases.test.ts`:
   - Returns 503 with JSON body `{ error: ... }` when global ceiling breached
   - Returns 503 when per-IP ceiling breached
   - Returns 200 (normal flow) when under both
   - 503 response includes `Retry-After` header
   - Mocks `spend-ledger` module to control state

6. **Update `web/.env.local.example`** with the two new optional env vars + comments explaining defaults and the recommendation to set them in production.

7. **Update `web/README.md`**:
   - Production checklist: add row for "Daily spend ceilings configured (DAILY_SPEND_CEILING_USD + PER_IP_DAILY_CEILING_USD)"
   - Env vars table: two new rows
   - Architecture notes: add a paragraph under "Rate limiting is built in" describing the spend-ledger circuit breaker as a complementary layer

8. **Set the two env vars in Vercel production:**
   - `DAILY_SPEND_CEILING_USD=5` (start conservative; raise if real usage trips it)
   - `PER_IP_DAILY_CEILING_USD=1`
   - Use `echo -n "5" | vercel env add ... production --sensitive` pattern per global rules

9. **Write plan + spec docs:**
   - `docs/plans/2026-05-10-spend-ledger-circuit-breaker.md` (decisions + rationale + threat model)
   - `docs/specs/2026-05-10-spend-ledger-circuit-breaker.md` (implementation contract — function signatures, ledger key format, failure modes)

10. **Commit, push, deploy, smoke-test:**
    - Commit conventional `feat(web): cost ledger + circuit breaker for abuse prevention`
    - `vercel --prod`
    - Smoke test: hit `/api/fast` with a normal idea — should succeed and increment ledger. Verify via Upstash console (or via a debug endpoint — out of scope).
    - Browser smoke test on the live URL (per global rule about UI changes — though this is server-only, the user-visible surface is the 503 page, which I can verify by temporarily setting `DAILY_SPEND_CEILING_USD=0` then reverting).

11. **Cut GitHub release v3.3.0** with notes covering the abuse-prevention shape, what's in (Tier 1) and what's not (Tier 2/3 — link to the new GitHub issue).

12. **Open GitHub issue for Tier 2 + Tier 3** as a deferred-work tracker:
    - Title: "Tier 2 + Tier 3 abuse prevention: email gate for Full Validation, then proper auth + tiered quotas"
    - Body covers the full design from the session conversation (Resend/Postmark for magic link, quota per email, then later Clerk/NextAuth + Stripe for paid tiers gated on #20).
    - Label `enhancement`. Cross-references #20.

13. **Update `HANDOFF.md`** to reflect both today's spend-ledger work AND the still-pending Claude Design exploration as the next-session focus. The existing handoff (written earlier in this session, not yet committed because of CWD bug) needs revision to capture this additional work.

## Dependencies

- Steps 1 → 2, 3 (route wiring depends on the lib existing)
- Steps 4, 5 → require the lib to exist; otherwise independent
- Step 6, 7 → independent of code changes; could run in parallel
- Step 8 (Vercel env vars) → independent of all code changes; defaults work without it. Recommended but not required for the deploy to function.
- Step 9 (plan + spec docs) → independent; could be written first or alongside
- Step 10 (commit + deploy + smoke) → after 1-7 done
- Step 11 (release) → after 10
- Step 12 (issue) → independent; could open before, during, or after
- Step 13 (handoff) → last

Sequential bottleneck is steps 1 → 2 → 3 → 5 (lib → routes → integration tests). Steps 4, 6, 7, 9, 12 can fan out in parallel after step 1.

## Risks

| Risk | Likelihood | Severity | Mitigation |
|------|------------|----------|------------|
| Cost estimates drift from reality (Anthropic price changes) | Medium | Low — over/under-estimate by 20% just shifts when the cap trips | Constants at top of `spend-ledger.ts`. Document in design doc. Re-tune if real usage shows skew. |
| Upstash unavailable during a check | Low | Medium — would block all calls | `@upstash/redis` throws on connection error. Catch in `checkSpend`, log, **fail open** (allow the call). Better to over-spend by a few dollars than block all users on an Upstash hiccup. Same posture as rate-limit.ts. |
| In-memory fallback per-instance on Vercel = same problem rate-limit had | High | Medium — local dev is fine; production without Upstash env vars would silently fail-open | Document loudly in `.env.local.example` and README that the ledger requires Upstash for production. Reuses Upstash client we already have. |
| `recordSpend` fails silently after a successful response, ledger drifts low | Low | Low — slow drift, not abuse vector | Catch and log. Acceptable. The ceiling is soft; missing increments at the margin doesn't break the property. |
| Estimate-cost approach undercounts long sessions | Medium | Low — chat-with-search is currently $0.50, but a session with 12 web searches and a long conversation could be $1.50+ | Tune the estimate up if observed real cost differs. Easy to change — single constant. |
| 503 surface confuses real users who hit the ceiling | Medium | Low | The friendly response copy explains it ("portfolio piece — we cap daily AI spend deliberately") + offers Fast Check as alternative. |
| Per-IP-only abuse via VPN rotation evades per-IP cap but not global | High | Low (with global cap in place) | Per-IP cap doesn't have to stop everyone; it stops casual single-user abuse. The global cap catches what per-IP misses. Combined, they meet the threat model. |
| Retry-After header math is wrong | Low | Low | Compute from `now → start of next UTC day` more precisely; or default to `86400`. Either is fine. |
| Browser smoke test of the 503 path requires temporarily setting ceiling to 0, which would block real users | Medium | Low — only briefly | Smoke-test via `curl` with a mocked-low ceiling on a preview deployment, OR write a Vitest integration test that's the actual verification. The latter is better. |

## Out of scope (deferred to GitHub issue)

- **Tier 2 — Email gate for Full Validation.** Resend or Postmark magic link, JWT/cookie session, quota per email. ~1 day work. Captures portfolio-interest signal as a side benefit.
- **Tier 3 — Auth + paid-tier quotas.** Clerk / NextAuth, Stripe, tiered quota system. Part of the "becoming a paid product" build, gated on #20.
- **Real Anthropic cost API integration.** Anthropic's response doesn't surface dollar cost. We use estimates. Could be revisited if/when Anthropic exposes per-call cost.
- **Admin / observability surface.** A dashboard showing today's spend, top IPs, recent 503s. Useful but not load-bearing — start with logs and Upstash console.

## Acceptance criteria (Tier 1 done when)

- [ ] `web/src/lib/spend-ledger.ts` exists with the four-function API
- [ ] Both `/api/fast` and `/api/chat` check before processing and record after success
- [ ] Tests pass — at least 6 new unit tests + 4 new integration tests covering the new paths
- [ ] `.env.local.example` documents the two new env vars with defaults
- [ ] `web/README.md` Production checklist + env vars table updated
- [ ] `DAILY_SPEND_CEILING_USD=5` and `PER_IP_DAILY_CEILING_USD=1` set in Vercel production
- [ ] Live deploy serves 503 with the friendly body when ceilings breached (verified via temporary low-ceiling test or integration test)
- [ ] v3.3.0 GitHub release published with notes
- [ ] GitHub issue opened for Tier 2/3 deferred work
- [ ] HANDOFF.md updated and committed
