/**
 * Integration tests for POST /api/stripe/webhook
 *
 * Verifies signature gate, idempotency, side-effect wiring, and fail-closed
 * error handling on the paid path.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockConstructEvent = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(),
  resetStripeClient: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  notifyOrderPaid: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/fulfilment", () => ({
  fulfilOrder: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/analytics-server", () => ({
  captureServer: vi.fn().mockResolvedValue(undefined),
  resetAnalyticsClient: vi.fn(),
}));

import { POST } from "@/app/api/stripe/webhook/route";
import { getStripe } from "@/lib/stripe";
import {
  createPendingOrder,
  markOrderPaid,
  resetOrderStores,
} from "@/lib/orders";
import * as ordersMod from "@/lib/orders";
import { notifyOrderPaid } from "@/lib/notifications";
import { fulfilOrder } from "@/lib/fulfilment";
import { captureServer } from "@/lib/analytics-server";

const SESSION_ID = "cs_test_webhook_123";

function checkoutCompletedEvent(sessionId = SESSION_ID) {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        customer_details: { email: "buyer@example.com" },
        amount_total: 499,
        currency: "gbp",
        metadata: {
          proveit_session_id: "proveit_sess_1",
          idea_summary: "A validated idea",
        },
      },
    },
  };
}

function makeWebhookRequest(
  body = JSON.stringify({ id: "evt_test" }),
  headers: Record<string, string> = { "stripe-signature": "sig_test" },
): NextRequest {
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body,
  });
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetOrderStores();
    process.env.STRIPE_SECRET_KEY = "sk_test_webhook";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    vi.mocked(getStripe).mockReturnValue({
      webhooks: { constructEvent: mockConstructEvent },
    } as unknown as ReturnType<typeof getStripe>);
  });

  it("returns 503 when Stripe is not configured", async () => {
    vi.mocked(getStripe).mockReturnValue(null);

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "Stripe not configured" });
  });

  it("returns 503 when webhook secret is unset", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "Webhook secret not configured" });
  });

  it("returns 400 when Stripe-Signature header is missing", async () => {
    const res = await POST(makeWebhookRequest("{}", {}));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Missing Stripe-Signature header" });
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Signature verification failed" });
  });

  it("returns 200 for non-checkout event types without side effects", async () => {
    mockConstructEvent.mockReturnValue({ type: "customer.created", data: { object: {} } });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(notifyOrderPaid).not.toHaveBeenCalled();
    expect(fulfilOrder).not.toHaveBeenCalled();
  });

  it("marks order paid and triggers notify + fulfilment on first delivery", async () => {
    await createPendingOrder({
      checkoutSessionId: SESSION_ID,
      proveitSessionId: "proveit_sess_1",
      ideaSummary: "A validated idea",
    });
    mockConstructEvent.mockReturnValue(checkoutCompletedEvent());

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);

    expect(notifyOrderPaid).toHaveBeenCalledOnce();
    expect(notifyOrderPaid).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "buyer@example.com",
        ideaSummary: "A validated idea",
      }),
    );
    expect(captureServer).toHaveBeenCalledWith(
      "checkout_completed",
      "proveit_sess_1",
      expect.objectContaining({ checkout_session_id: SESSION_ID }),
    );
    expect(fulfilOrder).toHaveBeenCalledOnce();
  });

  it("is idempotent — duplicate webhook does not re-notify", async () => {
    await createPendingOrder({ checkoutSessionId: SESSION_ID });
    await markOrderPaid(SESSION_ID, "buyer@example.com");
    mockConstructEvent.mockReturnValue(checkoutCompletedEvent());

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);
    expect(notifyOrderPaid).not.toHaveBeenCalled();
    expect(fulfilOrder).not.toHaveBeenCalled();
  });

  it("returns 500 when markOrderPaid throws so Stripe retries", async () => {
    mockConstructEvent.mockReturnValue(checkoutCompletedEvent("cs_throws"));
    vi.spyOn(ordersMod, "markOrderPaid").mockRejectedValueOnce(
      new Error("database unavailable"),
    );

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: "Internal processing error" });
  });
});
