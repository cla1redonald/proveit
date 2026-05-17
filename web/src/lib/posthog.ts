import posthog from "posthog-js";

let initialised = false;

/**
 * Initialise PostHog client-side analytics. Idempotent — safe to call from
 * multiple component mounts. Skips if no project key is configured (e.g. local
 * dev without env vars set).
 */
export function initPostHog(): void {
  if (initialised) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

  posthog.init(key, {
    api_host: host,
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: true,
    // Capture unhandled exceptions and Promise rejections on the client.
    // Stack traces only — no application state, no message content.
    // Story #42 / Epic #24 pre-launch error tracking.
    capture_exceptions: true,
    persistence: "localStorage+cookie",
    person_profiles: "identified_only",
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") {
        ph.debug();
      }
    },
  });

  initialised = true;
}

/**
 * Capture a named event. Quiet no-op if PostHog hasn't initialised yet
 * (e.g. SSR, or the user has blocked PostHog with an extension).
 */
export function captureEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  if (!initialised) return;
  posthog.capture(event, properties);
}

export { posthog };
