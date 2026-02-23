import "server-only";

/**
 * IP-based rate limiter with two backends:
 *
 * 1. Upstash Redis (distributed) — used when UPSTASH_REDIS_REST_URL and
 *    UPSTASH_REDIS_REST_TOKEN are set. Survives cold starts and works across
 *    multiple Vercel instances. Required for public production deployments.
 *    Set up at: https://console.upstash.com/
 *
 * 2. In-memory sliding window — used when Upstash env vars are absent.
 *    Resets on cold start; fine for personal / single-instance use.
 *
 * Limits:
 * - /api/chat: 20 requests per IP per 60 seconds
 * - /api/fast: 10 requests per IP per 60 seconds
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Upstash distributed limiter ────────────────────────────────────────────

function buildUpstashLimiter(limit: number, windowSeconds: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: false,
  });
}

// Lazily initialised so missing env vars don't crash startup
let _chatLimiter: Ratelimit | null | undefined;
let _fastLimiter: Ratelimit | null | undefined;

function getChatLimiter(): Ratelimit | null {
  if (_chatLimiter === undefined) _chatLimiter = buildUpstashLimiter(20, 60);
  return _chatLimiter;
}

function getFastLimiter(): Ratelimit | null {
  if (_fastLimiter === undefined) _fastLimiter = buildUpstashLimiter(10, 60);
  return _fastLimiter;
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

interface WindowEntry {
  count: number;
  windowStart: number;
}

const stores = new Map<string, Map<string, WindowEntry>>();

function getStore(endpoint: string): Map<string, WindowEntry> {
  if (!stores.has(endpoint)) {
    stores.set(endpoint, new Map());
  }
  return stores.get(endpoint)!;
}

function purgeStale(store: Map<string, WindowEntry>, windowMs: number): void {
  const cutoff = Date.now() - windowMs * 2;
  for (const [key, entry] of store.entries()) {
    if (entry.windowStart < cutoff) store.delete(key);
  }
}

function checkInMemory(
  ip: string,
  endpoint: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const store = getStore(endpoint);
  purgeStale(store, windowMs);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + windowMs };
  }
  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.windowStart + windowMs };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp ms
}

/**
 * Check rate limit for the given IP and endpoint.
 *
 * `limit` and `windowMs` are used ONLY by the in-memory fallback path.
 * When Upstash is configured, the limiter is constructed once at startup with
 * the values from RATE_LIMITS and these parameters are silently ignored.
 * Always pass RATE_LIMITS[endpoint].limit / windowMs so both backends stay
 * consistent — callers should not rely on being able to override Upstash limits
 * at call time.
 */
export async function checkRateLimit(
  ip: string,
  endpoint: "chat" | "fast",
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const limiter = endpoint === "chat" ? getChatLimiter() : getFastLimiter();

  if (limiter) {
    // Upstash path — limit/windowMs are baked into the limiter at construction
    // time (see buildUpstashLimiter). The parameters above are not forwarded here.
    const result = await limiter.limit(ip);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset, // Upstash returns reset as Unix ms
    };
  }

  // In-memory fallback — limit/windowMs are respected here
  return checkInMemory(ip, endpoint, limit, windowMs);
}

/**
 * Extract the real client IP from Next.js request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "127.0.0.1";
}

/** Rate limit config per endpoint */
export const RATE_LIMITS = {
  chat: { limit: 20, windowMs: 60_000 },
  fast: { limit: 10, windowMs: 60_000 },
} as const;

/**
 * Reset in-memory rate limit state and force Upstash limiters to reinitialise.
 * Exported for use in tests only — do not call in production code.
 *
 * NOTE: This clears the in-memory store and resets the cached Upstash limiter
 * instances so they are rebuilt on the next call. It does NOT clear any data
 * stored in Upstash Redis — remote counters persist independently of this call.
 */
export function resetRateLimitStores(): void {
  stores.clear();
  _chatLimiter = undefined;
  _fastLimiter = undefined;
}
