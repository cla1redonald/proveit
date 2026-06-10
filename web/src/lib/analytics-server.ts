import "server-only";

/**
 * Server-side PostHog analytics client for API route event capture.
 *
 * Reuses NEXT_PUBLIC_POSTHOG_KEY + NEXT_PUBLIC_POSTHOG_HOST (already
 * provisioned for client analytics). No new env vars needed.
 *
 * Distinct from posthog-server.ts (which handles exception tracking):
 * this module is for business-event capture (checkout_initiated,
 * checkout_completed, etc.).
 *
 * Serverless note: serverless functions may terminate before the PostHog
 * client flushes its internal queue. `captureServer` calls `flush()` after
 * every event to ensure delivery before the function exits.
 *
 * PII: do NOT pass user content (email, idea text) in properties unless
 * documented. Pass only non-PII event metadata.
 *
 * Failure mode: quiet no-op when env vars are unset. Never throws.
 */

import { PostHog } from "posthog-node";

let _client: PostHog | null | undefined;

function getAnalyticsClient(): PostHog | null {
  if (_client !== undefined) return _client;

  const key =
    process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_KEY;
  if (!key) {
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
 * Capture a server-side analytics event.
 *
 * Quiet no-op when PostHog isn't configured. Explicit flush() after capture
 * so events are not lost in serverless cold-start terminations.
 */
export async function captureServer(
  event: string,
  distinctId: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  const client = getAnalyticsClient();
  if (!client) return;

  try {
    client.capture({ distinctId, event, properties });
    await client.flush();
  } catch (err) {
    console.error("[analytics-server] captureServer threw (swallowed):", err);
  }
}

/**
 * Reset the cached client. Test-only.
 */
export function resetAnalyticsClient(): void {
  _client = undefined;
}
