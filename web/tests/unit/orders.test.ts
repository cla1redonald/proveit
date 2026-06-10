/**
 * Unit tests for lib/orders.ts
 *
 * Verifies: in-memory create → getByCheckoutSession → markPaid flow,
 * idempotency guard (double-paid returns false), and createPendingOrder
 * returning a valid id.
 *
 * All tests use the in-memory fallback (no Supabase env vars).
 */
import { describe, it, expect, beforeEach } from "vitest";

// Must mock server-only before importing any server lib
import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import {
  createPendingOrder,
  getOrderByCheckoutSession,
  markOrderPaid,
  resetOrderStores,
  _getMemoryOrders,
} from "@/lib/orders";

describe("orders (in-memory)", () => {
  beforeEach(() => {
    resetOrderStores();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("createPendingOrder returns a non-empty id and stores the order", async () => {
    const id = await createPendingOrder({
      checkoutSessionId: "cs_test_abc123",
      proveitSessionId: "session-x",
      ideaSummary: "A great idea",
    });

    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);

    const orders = _getMemoryOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0].checkoutSessionId).toBe("cs_test_abc123");
    expect(orders[0].status).toBe("pending");
    expect(orders[0].ideaSummary).toBe("A great idea");
    expect(orders[0].email).toBeNull();
  });

  it("getOrderByCheckoutSession returns the matching order", async () => {
    await createPendingOrder({ checkoutSessionId: "cs_test_def456" });

    const order = await getOrderByCheckoutSession("cs_test_def456");
    expect(order).not.toBeNull();
    expect(order!.checkoutSessionId).toBe("cs_test_def456");
    expect(order!.status).toBe("pending");
  });

  it("getOrderByCheckoutSession returns null for unknown session id", async () => {
    const order = await getOrderByCheckoutSession("cs_nonexistent");
    expect(order).toBeNull();
  });

  it("markOrderPaid transitions status to paid and sets email", async () => {
    await createPendingOrder({ checkoutSessionId: "cs_test_ghi789" });

    const updated = await markOrderPaid("cs_test_ghi789", "buyer@example.com");
    expect(updated).toBe(true);

    const order = await getOrderByCheckoutSession("cs_test_ghi789");
    expect(order!.status).toBe("paid");
    expect(order!.email).toBe("buyer@example.com");
  });

  it("markOrderPaid is idempotent — second call returns false without re-updating", async () => {
    await createPendingOrder({ checkoutSessionId: "cs_test_idempotent" });

    const first = await markOrderPaid("cs_test_idempotent", "buyer@example.com");
    expect(first).toBe(true);

    const second = await markOrderPaid("cs_test_idempotent", "different@example.com");
    expect(second).toBe(false);

    // Email should not have changed on the second call
    const order = await getOrderByCheckoutSession("cs_test_idempotent");
    expect(order!.email).toBe("buyer@example.com");
    expect(order!.status).toBe("paid");
  });

  it("markOrderPaid returns false for an unknown session id", async () => {
    const result = await markOrderPaid("cs_unknown_session", "buyer@example.com");
    expect(result).toBe(false);
  });

  it("idea_summary is truncated to 500 chars", async () => {
    const longSummary = "x".repeat(600);
    await createPendingOrder({
      checkoutSessionId: "cs_test_truncate",
      ideaSummary: longSummary,
    });
    const orders = _getMemoryOrders();
    expect(orders[0].ideaSummary!.length).toBe(500);
  });

  it("stores transcript as-is", async () => {
    const transcript = [{ role: "user", content: "hello" }];
    await createPendingOrder({
      checkoutSessionId: "cs_test_transcript",
      transcript,
    });
    const order = await getOrderByCheckoutSession("cs_test_transcript");
    expect(order!.transcript).toEqual(transcript);
  });

  it("resetOrderStores clears all orders", async () => {
    await createPendingOrder({ checkoutSessionId: "cs_test_reset" });
    expect(_getMemoryOrders()).toHaveLength(1);
    resetOrderStores();
    expect(_getMemoryOrders()).toHaveLength(0);
  });
});
