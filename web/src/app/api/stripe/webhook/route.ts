import "server-only";
import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getOrderByCheckoutSession, markOrderPaid } from "@/lib/orders";
import { captureServer } from "@/lib/analytics-server";
import { notifyOrderPaid } from "@/lib/notifications";

export const runtime = "nodejs";

/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe webhook events. Handles `checkout.session.completed` only;
 * all other event types return 200 immediately (Stripe retries on non-2xx).
 *
 * Security: the raw request body is verified against the Stripe-Signature
 * header using STRIPE_WEBHOOK_SECRET. Returns 400 on verification failure.
 *
 * Idempotency: markOrderPaid returns false when the order is already paid+,
 * preventing duplicate notification emails on webhook retries.
 *
 * FAIL CLOSED: errors are logged loudly and the response is 500 (so Stripe
 * will retry). We never swallow errors silently on the paid path.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    console.error("[webhook] Stripe not configured — STRIPE_SECRET_KEY unset");
    return new Response(
      JSON.stringify({ error: "Stripe not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET unset — cannot verify signature");
    return new Response(
      JSON.stringify({ error: "Webhook secret not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // Read the raw body text — required for signature verification
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    console.error("[webhook] Failed to read request body:", err);
    return new Response(JSON.stringify({ error: "Could not read request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing Stripe-Signature header" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return new Response(
      JSON.stringify({ error: "Signature verification failed" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Only handle checkout completion — return 200 fast for everything else
  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = event.data.object;
  const checkoutSessionId = session.id;
  const customerEmail = session.customer_details?.email ?? null;

  try {
    // Idempotency guard — returns false if already processed
    const wasUpdated = await markOrderPaid(checkoutSessionId, customerEmail);

    if (wasUpdated) {
      // Fetch the full order for notification details
      const order = await getOrderByCheckoutSession(checkoutSessionId);

      // Analytics (fire-and-forget)
      captureServer(
        "checkout_completed",
        session.metadata?.proveit_session_id || "anonymous",
        {
          checkout_session_id: checkoutSessionId,
          amount_pence: session.amount_total ?? 499,
          currency: session.currency ?? "gbp",
        }
      ).catch((err: unknown) => {
        console.error("[webhook] analytics captureServer failed (swallowed):", err);
      });

      // Email Claire to fulfil manually (fire-and-forget)
      await notifyOrderPaid({
        email: customerEmail ?? "unknown",
        ideaSummary: order?.ideaSummary ?? session.metadata?.idea_summary ?? "",
        orderId: order?.id ?? checkoutSessionId,
        amountPence: session.amount_total ?? 499,
        ts: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // Throw loudly — Stripe will retry. Log with as much context as possible.
    console.error(
      `[webhook] CRITICAL: Failed to process checkout.session.completed for session ${checkoutSessionId}:`,
      err
    );
    return new Response(
      JSON.stringify({ error: "Internal processing error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
