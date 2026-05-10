import "server-only";

/**
 * Daily Anthropic-spend ledger with circuit breaker.
 *
 * Caps blast radius of cost-spike abuse on the public web app. Per-IP rate
 * limiting (see rate-limit.ts) handles single-machine abuse; this layer
 * handles viral distribution and VPN-rotation by enforcing two ceilings:
 *
 *   - Global daily ceiling (DAILY_SPEND_CEILING_USD, default $5)
 *   - Per-IP daily ceiling (PER_IP_DAILY_CEILING_USD, default $1)
 *
 * Backed by Upstash Redis (the same instance used for rate limiting). When
 * Upstash isn't configured the ledger falls back to an in-process Map,
 * suitable for local dev only — production MUST set the Upstash env vars.
 *
 * Design choices:
 *   - Estimate-per-call cost (Anthropic doesn't surface dollar cost in the
 *     response). Constants below; tune if real usage drifts.
 *   - Check-then-record: check before processing, increment after success.
 *     Failed Anthropic calls don't count.
 *   - Soft caps: bursty concurrent requests can both pass the check and
 *     both increment, briefly overshooting. Acceptable — the ceilings are
 *     blast-radius caps, not transactional hard limits.
 *   - Fail open on Upstash errors: better to over-spend by a few dollars
 *     than block all users on an Upstash hiccup. Same posture as rate-limit.ts.
 */

import { Redis } from "@upstash/redis";
import type { DiscoveryPhase } from "@/types";

// ─── Cost estimates (USD per call) ────────────────────────────────────────────
// Tune these if observed real usage drifts. They're conservative-ish —
// over-estimating shifts when the cap trips, but that's the safe direction.

const COST_FAST = 0.10;
const COST_CHAT_NO_SEARCH = 0.05;
const COST_CHAT_BRAIN_DUMP = 0.10; // brain_dump now has web_search at max_uses 3
const COST_CHAT_RESEARCH = 0.50; // research phase fires up to 12 web searches

// ─── Upstash client (lazy, shared with rate-limit.ts pattern) ────────────────

let _redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  _redis = url && token ? new Redis({ url, token }) : null;
  return _redis;
}

// ─── In-memory fallback (dev / tests only) ───────────────────────────────────

const memoryStore = new Map<string, number>();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Estimate the USD cost of a single API call. Used by both checkSpend
 * (before the call) and recordSpend (after). Symmetric on purpose — the
 * estimate is also what we record, so the ledger reflects intended budget
 * rather than measured actual.
 */
export function estimateCost(
  endpoint: "fast" | "chat",
  phase?: DiscoveryPhase
): number {
  if (endpoint === "fast") return COST_FAST;
  if (phase === "research") return COST_CHAT_RESEARCH;
  if (phase === "brain_dump") return COST_CHAT_BRAIN_DUMP;
  return COST_CHAT_NO_SEARCH;
}

export interface SpendCheck {
  allowed: boolean;
  reason?: "global_cap" | "per_ip_cap";
  globalSpendUsd: number;
  ipSpendUsd: number;
  globalCeilingUsd: number;
  ipCeilingUsd: number;
}

/**
 * Check whether a call costing approximately `estimatedCost` would push
 * either the global or per-IP daily counter over its ceiling. Does NOT
 * record — call recordSpend after a successful response.
 *
 * On Upstash error: returns allowed=true (fail open) and zero spend
 * values. The caller should not treat zero values as authoritative.
 */
export async function checkSpend(
  ip: string,
  estimatedCost: number
): Promise<SpendCheck> {
  const globalCeilingUsd = readCeiling("DAILY_SPEND_CEILING_USD", 5);
  const ipCeilingUsd = readCeiling("PER_IP_DAILY_CEILING_USD", 1);

  const dateKey = todayKey();
  const globalKey = `proveit:spend:${dateKey}`;
  const ipKey = `proveit:spend:${dateKey}:ip:${ip}`;

  const redis = getRedis();
  let globalSpendUsd = 0;
  let ipSpendUsd = 0;

  try {
    if (redis) {
      const [globalRaw, ipRaw] = await Promise.all([
        redis.get<string | number | null>(globalKey),
        redis.get<string | number | null>(ipKey),
      ]);
      globalSpendUsd = parseFloat(String(globalRaw ?? 0)) || 0;
      ipSpendUsd = parseFloat(String(ipRaw ?? 0)) || 0;
    } else {
      globalSpendUsd = memoryStore.get(globalKey) ?? 0;
      ipSpendUsd = memoryStore.get(ipKey) ?? 0;
    }
  } catch (err) {
    // Fail open — better to over-spend a few dollars than block all users
    console.error("[spend-ledger] checkSpend Upstash error, failing open:", err);
    return {
      allowed: true,
      globalSpendUsd: 0,
      ipSpendUsd: 0,
      globalCeilingUsd,
      ipCeilingUsd,
    };
  }

  if (globalSpendUsd + estimatedCost > globalCeilingUsd) {
    return {
      allowed: false,
      reason: "global_cap",
      globalSpendUsd,
      ipSpendUsd,
      globalCeilingUsd,
      ipCeilingUsd,
    };
  }
  if (ipSpendUsd + estimatedCost > ipCeilingUsd) {
    return {
      allowed: false,
      reason: "per_ip_cap",
      globalSpendUsd,
      ipSpendUsd,
      globalCeilingUsd,
      ipCeilingUsd,
    };
  }

  return {
    allowed: true,
    globalSpendUsd,
    ipSpendUsd,
    globalCeilingUsd,
    ipCeilingUsd,
  };
}

/**
 * Record actual (estimated) spend for a successful call. Increments both
 * the global and per-IP counters and sets a 48h expiry on first creation
 * so old days auto-clean.
 *
 * On Upstash error: logs and swallows. Missing increments at the margin
 * cause the ledger to drift low — acceptable; we'd rather not hard-fail
 * the response path on a logging-side issue.
 */
export async function recordSpend(ip: string, actualCost: number): Promise<void> {
  const dateKey = todayKey();
  const globalKey = `proveit:spend:${dateKey}`;
  const ipKey = `proveit:spend:${dateKey}:ip:${ip}`;

  const redis = getRedis();
  try {
    if (redis) {
      await Promise.all([
        redis.incrbyfloat(globalKey, actualCost).then(() => redis.expire(globalKey, 48 * 3600)),
        redis.incrbyfloat(ipKey, actualCost).then(() => redis.expire(ipKey, 48 * 3600)),
      ]);
    } else {
      memoryStore.set(globalKey, (memoryStore.get(globalKey) ?? 0) + actualCost);
      memoryStore.set(ipKey, (memoryStore.get(ipKey) ?? 0) + actualCost);
    }
  } catch (err) {
    console.error("[spend-ledger] recordSpend error (swallowed):", err);
  }
}

/**
 * Reset all in-memory and Upstash-cached state. Tests only — do not call
 * in production. Note: only clears the cached Redis client and the
 * in-memory fallback; data already in Upstash persists.
 */
export function resetSpendStores(): void {
  memoryStore.clear();
  _redis = undefined;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readCeiling(envVar: string, fallback: number): number {
  const raw = process.env[envVar];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function todayKey(): string {
  // YYYY-MM-DD in UTC. Daily granularity, global app, UTC is fine.
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
