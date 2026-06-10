/**
 * Unit tests for lib/fulfilment.ts
 *
 * Verifies:
 *   - fulfilOrder is idempotent (deck_ready skips)
 *   - fulfilOrder sets status='failed' on error and re-throws
 *   - fulfilOrder throws when order is not found
 *   - fulfilOrder advances status pipeline: paid → artifacts_sent → deck_ready
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

// ─── Mock all dependencies ─────────────────────────────────────────────────

vi.mock("@/lib/deck/compose", () => ({
  composeDeckContent: vi.fn().mockResolvedValue({
    findings: [{ title: "Finding one", body: "Body one." }],
    recommendations: [{ title: "Do this", body: "Because of that." }],
    soWhat: "The single most important thing.",
    artifacts: {
      specMd: "# Spec\n\nContent.",
      designBriefMd: "# Brief\n\nContent.",
      promptsMd: "# Prompts\n\n## Research\n```\nPrompt\n```",
    },
  }),
}));

vi.mock("@/lib/deck/template", () => ({
  renderDeckHtml: vi.fn().mockReturnValue("<html><body>DECK</body></html>"),
}));

vi.mock("@/lib/deck/storage", () => ({
  putDeck: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notifications", () => ({
  sendArtifactsEmail: vi.fn().mockResolvedValue(undefined),
  sendDeckReadyEmail: vi.fn().mockResolvedValue(undefined),
  notifyOrderPaid: vi.fn().mockResolvedValue(undefined),
}));

// ─── In-memory order store ────────────────────────────────────────────────────

const orderStore = new Map<string, {
  id: string;
  checkoutSessionId: string;
  proveitSessionId: string | null;
  ideaSummary: string | null;
  transcript: unknown;
  email: string | null;
  status: string;
  amountPence: number;
  currency: string;
  deckUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}>();

vi.mock("@/lib/orders", () => ({
  getOrderById: vi.fn(async (id: string) => orderStore.get(id) ?? null),
  updateOrderStatus: vi.fn(async (id: string, status: string, extras?: { deckUrl?: string; error?: string }) => {
    const order = orderStore.get(id);
    if (!order) return;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (extras?.deckUrl !== undefined) order.deckUrl = extras.deckUrl;
    if (extras?.error !== undefined) order.error = extras.error;
  }),
}));

function makeOrder(overrides: Partial<ReturnType<typeof orderStore.get>> = {}) {
  const id = overrides.id ?? "order-test-1";
  return {
    id,
    checkoutSessionId: "cs_test_123",
    proveitSessionId: "session-abc",
    ideaSummary: "A great validated idea",
    transcript: {
      id: "session-abc",
      ideaSummary: "A great validated idea",
      phase: "complete",
      messages: [
        { id: "m1", role: "user", content: "My idea is X", timestamp: 1000 },
        { id: "m2", role: "assistant", content: "Interesting, tell me more.", timestamp: 2000 },
      ],
      scores: { desirability: 70, viability: 60, feasibility: 75 },
      killSignals: [],
      researchComplete: true,
      createdAt: 1000,
      updatedAt: 2000,
    },
    email: "buyer@example.com",
    status: "paid",
    amountPence: 499,
    currency: "gbp",
    deckUrl: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("fulfilOrder", () => {
  beforeEach(() => {
    orderStore.clear();
    vi.clearAllMocks();
  });

  it("is idempotent — skips when order is already deck_ready", async () => {
    const order = makeOrder({ status: "deck_ready", deckUrl: "/deck/order-test-1" });
    orderStore.set(order.id, order);

    const { fulfilOrder } = await import("@/lib/fulfilment");
    await fulfilOrder(order.id);

    // None of the pipeline steps should have been called
    const { sendArtifactsEmail } = await import("@/lib/notifications");
    const { putDeck } = await import("@/lib/deck/storage");
    expect(sendArtifactsEmail).not.toHaveBeenCalled();
    expect(putDeck).not.toHaveBeenCalled();
  });

  it("throws when order is not found", async () => {
    const { fulfilOrder } = await import("@/lib/fulfilment");
    await expect(fulfilOrder("nonexistent-id")).rejects.toThrow("Order not found");
  });

  it("sets status=failed and rethrows when composeDeckContent throws", async () => {
    const order = makeOrder();
    orderStore.set(order.id, order);

    const { composeDeckContent } = await import("@/lib/deck/compose");
    vi.mocked(composeDeckContent).mockRejectedValueOnce(new Error("Model call failed"));

    const { fulfilOrder } = await import("@/lib/fulfilment");
    await expect(fulfilOrder(order.id)).rejects.toThrow("Model call failed");

    const stored = orderStore.get(order.id);
    expect(stored?.status).toBe("failed");
    expect(stored?.error).toContain("Model call failed");
  });

  it("sets status=failed when putDeck throws", async () => {
    const order = makeOrder({ status: "artifacts_sent" });
    orderStore.set(order.id, order);

    const { putDeck } = await import("@/lib/deck/storage");
    vi.mocked(putDeck).mockRejectedValueOnce(new Error("Storage write failed"));

    const { fulfilOrder } = await import("@/lib/fulfilment");
    await expect(fulfilOrder(order.id)).rejects.toThrow("Storage write failed");

    const stored = orderStore.get(order.id);
    expect(stored?.status).toBe("failed");
  });

  it("advances status through the full pipeline: paid → artifacts_sent → deck_ready", async () => {
    const order = makeOrder({ status: "paid" });
    orderStore.set(order.id, order);

    const { fulfilOrder } = await import("@/lib/fulfilment");
    await fulfilOrder(order.id);

    const stored = orderStore.get(order.id);
    expect(stored?.status).toBe("deck_ready");
    expect(stored?.deckUrl).toBe(`/deck/${order.id}`);

    const { sendArtifactsEmail, sendDeckReadyEmail } = await import("@/lib/notifications");
    expect(sendArtifactsEmail).toHaveBeenCalledOnce();
    expect(sendDeckReadyEmail).toHaveBeenCalledOnce();

    const { putDeck } = await import("@/lib/deck/storage");
    expect(putDeck).toHaveBeenCalledWith(order.id, expect.any(String));
  });

  it("resumes from artifacts_sent — skips email step, goes straight to deck", async () => {
    // Simulate a partially-completed order where artifacts were sent but
    // the deck step failed and the order was reset for retry.
    const order = makeOrder({ status: "artifacts_sent" });
    orderStore.set(order.id, order);

    const { fulfilOrder } = await import("@/lib/fulfilment");
    await fulfilOrder(order.id);

    const stored = orderStore.get(order.id);
    expect(stored?.status).toBe("deck_ready");

    // sendArtifactsEmail should NOT be called again (already sent)
    const { sendArtifactsEmail, sendDeckReadyEmail } = await import("@/lib/notifications");
    expect(sendArtifactsEmail).not.toHaveBeenCalled();
    expect(sendDeckReadyEmail).toHaveBeenCalledOnce();
  });
});
