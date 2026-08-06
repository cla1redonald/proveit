import posthog from "posthog-js";

let initialised = false;

export const ANALYTICS_CONSENT_KEY = "proveit_analytics_consent";
export const ANALYTICS_CONSENT_EVENT = "proveit:analytics-consent";
export type AnalyticsConsent = "granted" | "denied";

/** Read the browser-only analytics choice without touching localStorage on SSR. */
export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function saveAnalyticsConsent(consent: AnalyticsConsent): void {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);
  } catch {
    // Storage can be blocked by browser privacy settings. Analytics remains off.
  }
}

function notifyConsentChange(): void {
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
}

/**
 * Initialise PostHog client-side analytics. Idempotent — safe to call from
 * multiple component mounts. Skips if no project key is configured (e.g. local
 * dev without env vars set).
 */
export function initPostHog(): void {
  if (initialised) return;

  if (typeof window === "undefined" || getAnalyticsConsent() !== "granted") {
    return;
  }

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

/** Persist an opt-in decision and start analytics after the browser has consented. */
export function grantAnalyticsConsent(): void {
  if (typeof window === "undefined") return;

  saveAnalyticsConsent("granted");
  posthog.clear_opt_in_out_capturing();
  initPostHog();
  notifyConsentChange();
}

/** Persist an opt-out decision and stop any already-running PostHog session. */
export function revokeAnalyticsConsent(): void {
  if (typeof window === "undefined") return;

  saveAnalyticsConsent("denied");
  posthog.opt_out_capturing();
  if (initialised) {
    posthog.reset();
    initialised = false;
  }
  notifyConsentChange();
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

/** Capture an exception only after the user has opted into analytics. */
export function captureException(
  error: unknown,
  properties?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  if (!initialised) return;
  posthog.captureException(error, properties);
}

export { posthog };
