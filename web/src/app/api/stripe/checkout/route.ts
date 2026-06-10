import "server-only";
import { NextRequest } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createPendingOrder } from "@/lib/orders";
import { captureServer } from "@/lib/analytics-server";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

const CheckoutBodySchema = z.object({
  proveitSessionId: z.string().trim().max(128).optional(),
  ideaSummary: z.string().trim().max(500).optional(),
  transcript: z.unknown().optional(),
});

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for the £4.99 one-off bundle and a
 * `pending` order row, then returns { url } to redirect the browser to.
 *
 * Returns 503 when Stripe is not configured (STRIPE_SECRET_KEY unset) so
 * the UI can fall back to the WoZ modal without crashing.
 */
export async function POST(req: NextRequest) {
  // Rate limit — same fast limiter as other lightweight endpoints
  const ip = getClientIp(req);
  const { limit, windowMs } = RATE_LIMITS.fast;
  const rl = await checkRateLimit(ip, "fast", limit, windowMs);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many submissions. Please wait a moment and try again." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return new Response(
      JSON.stringify({ error: "Payment processing is not available yet. Please use the email option." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = CheckoutBodySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid input";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { proveitSessionId, ideaSummary, transcript } = parsed.data;

  // Derive the base URL for success/cancel redirects
  const host = req.headers.get("host") ?? "proveit.tools";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  try {
    // Build the line item — prefer a pre-created Stripe Price if configured
    // (better for reporting, discount codes, etc.); fall back to inline price_data.
    const lineItems: Stripe.Checkout.SessionCreateParams["line_items"] =
      process.env.STRIPE_PRICE_ID
        ? [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "gbp",
                unit_amount: 499, // £4.99 in pence
                product_data: {
                  name: "ProveIt Full Bundle",
                  description:
                    "Gamma deck, spec.md, design-brief.md, and paste-ready Claude Design prompts for your validated idea.",
                },
              },
              quantity: 1,
            },
          ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: {
        proveit_session_id: proveitSessionId ?? "",
        idea_summary: (ideaSummary ?? "").slice(0, 499), // Stripe metadata values max 500 chars
      },
      // Collect the customer's email at checkout so we can deliver the bundle
      customer_email: undefined, // let Stripe collect it
      success_url: `${baseUrl}/validate?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/validate?payment=cancelled`,
    });

    // Persist a pending order row so we can correlate the webhook
    await createPendingOrder({
      checkoutSessionId: session.id,
      proveitSessionId,
      ideaSummary,
      transcript,
    });

    // Fire-and-forget analytics — do not await on the critical path
    captureServer("checkout_initiated", proveitSessionId ?? "anonymous", {
      session_id: session.id,
      amount_pence: 499,
      currency: "gbp",
    }).catch((err: unknown) => {
      console.error("[checkout] analytics captureServer failed (swallowed):", err);
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[checkout] Stripe or order creation error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
