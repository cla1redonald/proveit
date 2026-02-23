import "server-only";

/**
 * In-memory IP-based rate limiter using a sliding window counter.
 *
 * Design constraints:
 * - No external dependencies (Redis, Upstash, etc.) — keeps infra simple
 * - Works on Node.js runtime (not Edge, which lacks Map persistence)
 * - Resets on cold start — acceptable for a single-instance Vercel deployment
 *
 * Limits:
 * - /api/chat: 20 requests per IP per 60 seconds
 * - /api/fast: 10 requests per IP per 60 seconds
 *
 * These are deliberately conservative — each request costs real Anthropic credits.
 * A legitimate PM using the app sends ~1 message every 10-30 seconds.
 */

interface WindowEntry {
  count: number;
  windowStart: number;
}

// Separate stores per endpoint so limits are independent
const stores = new Map<string, Map<string, WindowEntry>>();

function getStore(endpoint: string): Map<string, WindowEntry> {
  if (!stores.has(endpoint)) {
    stores.set(endpoint, new Map());
  }
  return stores.get(endpoint)!;
}

/**
 * Purge stale entries periodically to prevent unbounded memory growth.
 * Called on every rate limit check — purges entries older than 2x the window.
 */
function purgeStale(store: Map<string, WindowEntry>, windowMs: number): void {
  const cutoff = Date.now() - windowMs * 2;
  for (const [key, entry] of store.entries()) {
    if (entry.windowStart < cutoff) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp (ms) when the window resets
}

/**
 * Check rate limit for a given IP and endpoint.
 *
 * @param ip       - Client IP address (from X-Forwarded-For or connection)
 * @param endpoint - Logical endpoint name (e.g. "chat", "fast")
 * @param limit    - Max requests per window
 * @param windowMs - Window duration in milliseconds
 */
export function checkRateLimit(
  ip: string,
  endpoint: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const store = getStore(endpoint);
  purgeStale(store, windowMs);

  const now = Date.now();
  const key = ip;

  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + windowMs,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.windowStart + windowMs,
  };
}

/**
 * Extract the real client IP from Next.js request headers.
 * Vercel sets X-Forwarded-For; fall back to a safe default.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // X-Forwarded-For may be a comma-separated list; first entry is the client
    return forwarded.split(",")[0].trim();
  }
  // Fallback — Vercel always sets X-Forwarded-For, so this is only hit locally
  return "127.0.0.1";
}

/** Rate limit config per endpoint */
export const RATE_LIMITS = {
  chat: { limit: 20, windowMs: 60_000 },  // 20 req / 60s
  fast: { limit: 10, windowMs: 60_000 },  // 10 req / 60s
} as const;

/**
 * Reset all rate limit state.
 * Exported for use in tests only — do not call in production code.
 */
export function resetRateLimitStores(): void {
  stores.clear();
}
