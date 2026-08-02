# Spend ledger calibration

**Date:** 2026-08-02  
**Status:** Implemented

## Problem

The spend ledger (`web/src/lib/spend-ledger.ts`) uses **fixed USD estimates per call** because Anthropic does not return dollar cost in API responses. Estimates drift as models, prompts, and tool usage change.

## Solution

After each **successful** `/api/chat` or `/api/fast` stream, the route logs a structured line when Anthropic reports token usage:

```json
[spend-calibration] {"endpoint":"chat","phase":"research","estimated_usd":0.5,"input_tokens":4200,"output_tokens":1800}
```

Implementation: `web/src/lib/spend-calibration.ts` — `trackStreamUsage()` during the stream, `logSpendCalibration()` after `recordSpend()`.

## How to retune constants

1. Deploy with logging enabled (default — no env var required).
2. In Vercel/host logs, filter for `[spend-calibration]`.
3. Group by `endpoint` + `phase`; compare token totals to `estimated_usd`.
4. Adjust `COST_*` constants in `spend-ledger.ts` if estimates are consistently high or low.
5. Re-run a smoke test and confirm 503 caps still trip at the intended real-world spend.

## Notes

- Failed or timed-out calls do **not** log calibration (no `recordSpend` either).
- Logging is server-side only — no PII, no user idea text.
- When usage is unavailable (SDK gap, partial stream), logging is skipped silently.
