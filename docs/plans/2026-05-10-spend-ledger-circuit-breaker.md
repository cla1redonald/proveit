# Plan: Spend Ledger + Circuit Breaker (v3.3 — Tier 1 Abuse Prevention)

**Date:** 2026-05-10
**Status:** Implemented in v3.3.0 (`web/src/lib/spend-ledger.ts` + route wiring)
**Related gameplan:** [`docs/gameplans/2026-05-10-spend-ledger-circuit-breaker.md`](../gameplans/2026-05-10-spend-ledger-circuit-breaker.md)
**Related spec:** [`docs/specs/2026-05-10-spend-ledger-circuit-breaker.md`](../specs/2026-05-10-spend-ledger-circuit-breaker.md)

## Why now

The web app at proveit-web-zeta.vercel.app has been shared as a portfolio piece. Existing per-IP rate limiting (Upstash sliding window — 20/min for chat, 10/min for fast) handles single-machine abuse, but not:

1. **Viral distribution** — someone shares the URL on Reddit / HN / X and 1,000 people each run a Full Validation in a day. Each individual is under the rate limit; aggregate cost is real.
2. **VPN-rotation by a determined single user.**
3. **Sustained moderate abuse** — 50 people each running 1–2 deep validations a day. No single IP triggers the limiter.

Cost shape:
- Fast Check: ~$0.05–$0.15 per call. Annoying-but-survivable abuse target.
- Full Validation with web search: ~$0.50–$3 per session. Research phase fires 9+ web searches at $0.01 each plus thousands of tokens.
- A bad day where 200 people share + run Full Validation could hit $200–$600.

The user (Claire) wants the URL to remain shareable as a portfolio piece without exposure to that downside. Tier 2 (email gate) and Tier 3 (proper auth + paid tiers) are out of scope for this pass — captured as a GitHub issue for later.

## Decisions

### 1. Tiered architecture, ship Tier 1 today

| Tier | Mechanism | Status |
|------|-----------|--------|
| Tier 1 | Server-side daily spend ledger + circuit breaker (Upstash, no auth) | **This release (v3.3.0)** |
| Tier 2 | Email gate for Full Validation (magic link, quota per email) | Deferred to GitHub issue, picks up after #20 (or sooner if abuse signals warrant) |
| Tier 3 | Proper auth + paid-tier quotas (Clerk/NextAuth + Stripe) | Part of the "becoming a paid product" build, fully gated on #20 |

### 2. Two ceilings — global and per-IP

- **Global daily ceiling** (`DAILY_SPEND_CEILING_USD`, default $5) catches viral distribution and aggregate abuse
- **Per-IP daily ceiling** (`PER_IP_DAILY_CEILING_USD`, default $1) stops casual single-user abuse including VPN-rotation within a single attack window

Both checked on every request; the first to breach wins (`reason: "global_cap"` takes precedence over `reason: "per_ip_cap"` when both would apply).

### 3. Estimate per-call cost (Anthropic doesn't surface dollar cost)

Constants at the top of `spend-ledger.ts`. Tunable without code re-read:

| Endpoint | Phase | Estimated cost | Why |
|----------|-------|----------------|-----|
| `/api/fast` | n/a | $0.10 | Streaming, no web search |
| `/api/chat` | `brain_dump` | $0.10 | Now has `web_search` at `max_uses: 3` for Phase 0 URL fetching |
| `/api/chat` | `research` | $0.50 | Up to 12 web searches + long context |
| `/api/chat` | other phases | $0.05 | Conversation only, no tools |

Conservative bias acceptable. If real usage shows skew, retune the constants.

### 4. Check-then-record, soft caps

- `checkSpend(ip, estimatedCost)` reads current counters; allowed if `current + estimate <= ceiling` for both global and per-IP
- `recordSpend(ip, actualCost)` increments only on successful response (after Anthropic stream completes cleanly, before `controller.close()`)
- Bursty concurrent requests can both pass the check and both increment, briefly overshooting. **Acceptable** — the ceilings are blast-radius caps, not transactional hard limits

### 5. Fail open on Upstash errors

If Upstash is unavailable (network blip, service down), `checkSpend` returns `allowed: true` with zeroed-out spend values. Same posture as `rate-limit.ts`. Better to over-spend a few dollars than block all users on a transient hiccup.

### 6. Friendly 503 framed as portfolio responsibility

Not "rate limited" or "quota exceeded". Copy explicitly says:

> "ProveIt is at capacity for today. The site is a portfolio piece — daily AI spend is deliberately capped. Try again tomorrow, or fall back to the Fast Check on the home page."

Per-IP variant is more direct ("You've used today's free Full Validation budget for this connection"). Both include `Retry-After` header pointing at start of next UTC day.

## Threat model

| Threat | Old defence | New defence | Adequate? |
|--------|-------------|-------------|-----------|
| Single-machine flood | Per-IP rate limit | Per-IP rate limit + per-IP daily cap | Yes — multi-layered |
| VPN rotation by one attacker | None | Global daily cap + per-IP daily cap | Yes — global cap wins |
| Reddit/HN viral spike | None | Global daily cap | Yes — total bill capped |
| Sustained 50-user moderate use | None | Global daily cap | Yes — same mechanism |
| Prompt injection draining tokens | System-prompt anti-injection guard | Same + estimate-cost ledger | Yes |
| Long-message attack | Zod max(10000) per msg + max 50 msgs | Same | Yes (already mitigated) |
| Distributed botnet | None | Global daily cap | Limited — per-IP cap doesn't help, but global cap still bounds blast radius |
| Social-engineering Claire's Anthropic key | server-only guard, key not in client | Same | Yes (already mitigated) |

## Out of scope (deferred to GitHub issue)

- **Tier 2 — Email gate.** Resend/Postmark magic link, JWT/cookie session, quota per email (~3 free Full Validations). ~1 day of work. Captures portfolio-interest signal as a side benefit.
- **Tier 3 — Auth + paid tiers.** Clerk/NextAuth + Stripe + tiered quotas. Part of the "becoming a paid product" build, fully gated on #20.
- **Real Anthropic cost API integration.** Anthropic's response doesn't surface dollar cost. We use estimates. Could be revisited if Anthropic exposes per-call cost in the API.
- **Admin / observability surface.** A dashboard showing today's spend, top IPs, recent 503s. Useful but not load-bearing — start with logs and the Upstash console.
- **Per-day per-user quotas with reset times that aren't UTC midnight.** Daily granularity with UTC reset is fine for global app.

## Migration / risks

- **In-memory fallback in production = same problem rate-limit had.** Reuses the same Upstash client. Documented loudly in `.env.local.example` and README. Production checklist explicitly adds a row for the spend ceilings.
- **Cost estimates drift.** Constants at top of `spend-ledger.ts`, easy to retune. No deploy needed if you tune via env vars (currently constants — could be promoted to env if frequently retuned).
- **Bursty overshoot.** Soft caps; concurrent requests can both pass. Sub-dollar overshoot in practice. Acceptable.
- **Existing tests need spend-ledger reset.** All integration tests that make multiple calls now `resetSpendStores()` in `beforeEach` (caught during the test pass).

## Verification

- 15 new unit tests in `web/tests/unit/spend-ledger.test.ts` — covers `estimateCost`, `checkSpend` happy path, both blocked paths, env override, default fallback, invalid env, in-memory state isolation
- 4 new integration tests per route (`api-fast-edge-cases.test.ts` + `api-chat-edge-cases.test.ts`) — covers 503 with `reason: "global_cap"`, 503 with `reason: "per_ip_cap"`, no Anthropic call when blocked, headroom path
- 205/205 total tests passing as of v3.3.0
- Production smoke test pending after deploy (covered in next release notes)

## Implementation order (followed)

1. `web/src/lib/spend-ledger.ts` (new lib)
2. Wire into `/api/fast` and `/api/chat` route handlers
3. Unit tests + integration tests
4. `.env.local.example` + `web/README.md` updates
5. Set `DAILY_SPEND_CEILING_USD=5` and `PER_IP_DAILY_CEILING_USD=1` in Vercel production
6. Plan + spec docs (this file + spec)
7. Commit, push, deploy, smoke test, cut v3.3.0 release
8. Open GitHub issue for Tier 2/3
9. Update `HANDOFF.md`
