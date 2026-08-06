import "server-only";

/**
 * Server-side PostHog client for error tracking + telemetry from API routes.
 *
 * Story #42 / Epic #24 pre-launch error tracking. Mirrors the client-side
 * posthog-js wiring (lib/posthog.ts) so server errors land in the same
 * project as client errors.
 *
 * Env vars: reuses NEXT_PUBLIC_POSTHOG_KEY + NEXT_PUBLIC_POSTHOG_HOST, but
 * requires POSTHOG_SERVER_ENABLED=true. Server telemetry is deliberately
 * disabled unless explicitly enabled after the privacy notice is reviewed.
 *
 * PII: callers must not pass user-typed content (idea text, chat messages,
 * email addresses) in properties. Pass only error objects + non-PII context
 * like the route path, request method, and rate-limit bucket.
 *
 * Failure mode: quiet no-op when env vars are unset. Errors during capture
 * are swallowed and logged — never throw to the caller.
 *
 * Lifecycle: singleton so we share the in-flight queue across requests.
 * flushAt: 1 + flushInterval: 0 means events are sent immediately (no
 * batching) — important in a serverless function where the process may
 * terminate before a normal flush.
 */

import { PostHog } from "posthog-node";

let _client: PostHog | null | undefined;

export function getPostHogServer(): PostHog | null {
  if (_client !== undefined) return _client;

  if (process.env.POSTHOG_SERVER_ENABLED !== "true") {
    _client = null;
    return _client;
  }

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    console.warn("[posthog-server] NEXT_PUBLIC_POSTHOG_KEY unset — server error tracking disabled");
    _client = null;
    return _client;
  }

  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

  _client = new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
  });
  return _client;
}

/**
 * Capture a server-side exception. Quiet no-op when PostHog isn't configured.
 *
 * Do NOT pass user content in `properties` — the idea text and chat
 * messages must stay private. Stick to route metadata (path, method, IP
 * hash, rate-limit bucket).
 */
export async function captureServerException(
  err: unknown,
  properties: Record<string, unknown> = {},
  distinctId?: string
): Promise<void> {
  const client = getPostHogServer();
  if (!client) return;

  try {
    const error = err instanceof Error ? err : new Error(String(err));
    await client.captureException(error, distinctId, properties);
  } catch (captureErr) {
    console.error("[posthog-server] captureException threw (swallowed):", captureErr);
  }
}

/**
 * Test-only — reset the cached client. Used by unit tests so they can
 * re-evaluate the env-var-based init path.
 */
export function resetPostHogServer(): void {
  _client = undefined;
}
