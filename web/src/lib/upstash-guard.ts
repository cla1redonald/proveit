import "server-only";

/**
 * Production guardrail: Upstash Redis is required when NODE_ENV=production.
 * Without it, rate limits and the spend ledger fall back to in-memory stores
 * that reset on every serverless cold start — effectively no abuse protection.
 *
 * Local dev and Vitest (NODE_ENV=test) may omit Upstash and use the fallback.
 */

export function isUpstashConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

export function upstashRequiredInProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function upstashGuardResponse(): Response {
  return new Response(
    JSON.stringify({
      error:
        "Cost controls are unavailable — the service is misconfigured. Please try again later.",
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/** Returns a 503 Response in production when Upstash env vars are missing. */
export function requireUpstashInProduction(): Response | null {
  if (!upstashRequiredInProduction() || isUpstashConfigured()) return null;
  console.error(
    "[upstash-guard] UPSTASH_REDIS_REST_URL/TOKEN unset in production — blocking AI route"
  );
  return upstashGuardResponse();
}
