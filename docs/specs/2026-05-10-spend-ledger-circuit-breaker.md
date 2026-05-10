# Spec: Spend Ledger + Circuit Breaker (v3.3)

**Date:** 2026-05-10
**Status:** Implemented in v3.3.0
**Related plan:** [`docs/plans/2026-05-10-spend-ledger-circuit-breaker.md`](../plans/2026-05-10-spend-ledger-circuit-breaker.md)
**Related gameplan:** [`docs/gameplans/2026-05-10-spend-ledger-circuit-breaker.md`](../gameplans/2026-05-10-spend-ledger-circuit-breaker.md)

## 1. Public API — `web/src/lib/spend-ledger.ts`

```typescript
// Estimates the USD cost of a single API call.
// Constants at the top of the file; tune in code if real usage drifts.
function estimateCost(
  endpoint: "fast" | "chat",
  phase?: DiscoveryPhase
): number;

// Checks whether a call costing approximately estimatedCost would push
// either the global or per-IP daily counter over its ceiling. Does NOT
// record. Returns SpendCheck.
async function checkSpend(
  ip: string,
  estimatedCost: number
): Promise<SpendCheck>;

// Records actual (estimated) spend for a successful call. Increments
// both global and per-IP counters in Upstash with a 48h expiry.
// Errors are swallowed (log + continue) — best-effort.
async function recordSpend(ip: string, actualCost: number): Promise<void>;

// Test-only. Clears in-memory fallback and the cached Redis client.
// Does NOT clear data already in Upstash.
function resetSpendStores(): void;

// Result shape from checkSpend
interface SpendCheck {
  allowed: boolean;
  reason?: "global_cap" | "per_ip_cap";  // present iff !allowed
  globalSpendUsd: number;                  // current spend
  ipSpendUsd: number;                      // current spend for this IP
  globalCeilingUsd: number;
  ipCeilingUsd: number;
}
```

## 2. Cost estimates (USD per call)

| Endpoint | Phase | Cost |
|----------|-------|------|
| `/api/fast` | n/a | $0.10 |
| `/api/chat` | `brain_dump` | $0.10 (web_search at max_uses: 3 for Phase 0) |
| `/api/chat` | `research` | $0.50 (up to 12 web searches) |
| `/api/chat` | `discovery` / `findings` / `complete` | $0.05 (no tools) |

## 3. Upstash key format

- Global daily counter: `proveit:spend:YYYY-MM-DD` (UTC)
- Per-IP daily counter: `proveit:spend:YYYY-MM-DD:ip:<ip>`

`INCRBYFLOAT` on each `recordSpend`. `EXPIRE` set to 48 hours on first creation so old days auto-clean.

## 4. Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DAILY_SPEND_CEILING_USD` | `5` | Global daily ceiling |
| `PER_IP_DAILY_CEILING_USD` | `1` | Per-IP daily ceiling |
| `UPSTASH_REDIS_REST_URL` | — | Required for production (shared with rate-limit.ts) |
| `UPSTASH_REDIS_REST_TOKEN` | — | Same |

Read at call time, not module load time, so changes take effect without redeploy.

## 5. Route integration contract

Both `/api/fast` and `/api/chat` follow the same pattern:

1. `getClientIp(req)` → `ip`
2. **Rate limit check** (existing — Upstash sliding window). If blocked, return 429.
3. **Spend ledger check** — `estimateCost(...)` then `checkSpend(ip, cost)`. If `!allowed`, return 503 with friendly JSON body containing `error` and `reason`, `Retry-After` header set to seconds until next UTC midnight (minimum 60s).
4. Parse + zod-validate the body. Return 400 on validation failure.
5. Build system prompt, build tools array, build stream.
6. **On successful stream completion** (after `done` event, before `controller.close()`), call `recordSpend(ip, cost)`. Increments only on success — failed Anthropic calls don't count.

`/api/chat` differs only in *when* the spend check happens — after parsing, because the cost depends on `phase` which is in the body. `/api/fast` checks before parsing because the cost is constant.

## 6. 503 response body shape

```json
{
  "error": "ProveIt is at capacity for today. The site is a portfolio piece — daily AI spend is deliberately capped. Try again tomorrow, or fall back to the Fast Check on the home page.",
  "reason": "global_cap"
}
```

Or with `reason: "per_ip_cap"`:

```json
{
  "error": "You've used today's free Full Validation budget for this connection. Try again tomorrow, or use the Fast Check.",
  "reason": "per_ip_cap"
}
```

Headers:
- `Status: 503`
- `Content-Type: application/json`
- `Retry-After: <seconds-until-next-utc-day>` (at least 60)

Clients can branch on `reason` if they want to display different messaging or auto-retry strategies.

## 7. Failure modes

| Scenario | Behaviour |
|----------|-----------|
| Upstash unreachable during `checkSpend` | Catch, log, return `allowed: true` with zeroed spend values (fail open) |
| Upstash unreachable during `recordSpend` | Catch, log, swallow (ledger drift is acceptable) |
| Env vars not set | Use defaults ($5 / $1) |
| Env vars non-numeric or negative | Use defaults |
| Local dev (no Upstash configured) | In-memory fallback `Map<string, number>` — per-instance, not shared. Documented as dev-only. |

## 8. Test coverage

Unit (`tests/unit/spend-ledger.test.ts` — 15 tests):
- `estimateCost` per endpoint + phase
- `checkSpend` happy path (under both ceilings)
- `checkSpend` blocks with `per_ip_cap` when one IP over its limit
- `checkSpend` allows other IPs when only first IP over limit
- `checkSpend` blocks with `global_cap` when global ceiling hit (multiple IPs)
- `checkSpend` global cap takes precedence when both would block
- `checkSpend` respects env override
- `checkSpend` falls back to defaults when env missing or invalid
- `recordSpend` increments counters; subsequent `checkSpend` reflects increment
- `resetSpendStores` clears in-memory state

Integration (`tests/integration/api-{fast,chat}-edge-cases.test.ts` — 4 + 4 tests):
- Returns 503 with `reason: "global_cap"` when global ceiling breached
- Returns 503 with `reason: "per_ip_cap"` when per-IP ceiling breached
- Does not call Anthropic when ceiling breached
- Returns 200 normally when both ceilings have headroom
- (chat-only) Research-phase calls cost more in the ledger than other phases

## 9. Verification (real-world)

After deploy, smoke test by:

1. Live URL serves 200 normally for a Fast Check call (ledger increments, doesn't block)
2. Temporarily set `DAILY_SPEND_CEILING_USD=0` in a preview deployment, hit `/api/fast`, confirm 503 with the friendly body. Revert.
3. Watch Upstash console for `proveit:spend:*` keys appearing as users hit the live site
4. Set up Anthropic Console daily-spend alert at $X (whatever ceiling × 2) as a backup tripwire

## 10. Open questions for future iteration

- Should ceilings be tunable via env vars at runtime (currently yes — read on every call), or via a feature-flag service for finer-grained control? (Currently simple env-var read is enough.)
- Should the in-memory fallback warn loudly in logs at boot when running in production without Upstash? (Marginal value — production should always have Upstash; doc warning is in `.env.local.example` and README.)
- When Tier 2 (email gate) lands, the per-email quota replaces the per-IP cap for authenticated users; the global cap stays. Spec for that lives in the GitHub issue.
