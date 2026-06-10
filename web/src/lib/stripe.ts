import "server-only";

/**
 * Cached Stripe client for server-side use.
 *
 * Returns null when STRIPE_SECRET_KEY is unset (local dev / test builds run
 * without Stripe keys — the checkout route returns a 503 instead of crashing).
 *
 * API version is pinned to the SDK's `LatestApiVersion` ('2025-02-24.acacia').
 */

import Stripe from "stripe";

let _stripe: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (_stripe !== undefined) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("[stripe] STRIPE_SECRET_KEY unset — Stripe integration disabled");
    _stripe = null;
    return _stripe;
  }
  _stripe = new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
  });
  return _stripe;
}

/**
 * Reset the cached client. Test-only.
 */
export function resetStripeClient(): void {
  _stripe = undefined;
}
