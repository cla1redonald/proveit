/**
 * Unit tests for app/deck/[orderId]/route.ts
 *
 * Verifies:
 *   - Returns 404 when deck is not found
 *   - Returns 200 with text/html when deck exists
 *   - Returns 404 for missing or too-short orderId
 *   - Returns 500 on storage error
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Use vi.hoisted so the mock fn is available when the factory runs
const mockGetDeck = vi.hoisted(() => vi.fn<() => Promise<string | null>>());

vi.mock("@/lib/deck/storage", () => ({
  getDeck: mockGetDeck,
}));

// ─── Import route after mocks ─────────────────────────────────────────────────

import { GET } from "@/app/deck/[orderId]/route";
import { type NextRequest } from "next/server";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /deck/[orderId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when getDeck returns null", async () => {
    mockGetDeck.mockResolvedValueOnce(null);

    const req = new Request("http://localhost/deck/order123") as unknown as NextRequest;
    const res = await GET(req, {
      params: Promise.resolve({ orderId: "order123" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 200 with text/html and deck content when deck exists", async () => {
    const sampleHtml = "<!DOCTYPE html><html><body>DECK CONTENT</body></html>";
    mockGetDeck.mockResolvedValueOnce(sampleHtml);

    const req = new Request("http://localhost/deck/order456") as unknown as NextRequest;
    const res = await GET(req, {
      params: Promise.resolve({ orderId: "order456" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    const body = await res.text();
    expect(body).toBe(sampleHtml);
  });

  it("returns 404 for short orderId (less than 6 chars)", async () => {
    const req = new Request("http://localhost/deck/abc") as unknown as NextRequest;
    const res = await GET(req, {
      params: Promise.resolve({ orderId: "abc" }),
    });

    expect(res.status).toBe(404);
    // getDeck should NOT have been called
    expect(mockGetDeck).not.toHaveBeenCalled();
  });

  it("returns 500 when getDeck throws", async () => {
    mockGetDeck.mockRejectedValueOnce(new Error("Storage failure"));

    const req = new Request("http://localhost/deck/ordererr1") as unknown as NextRequest;
    const res = await GET(req, {
      params: Promise.resolve({ orderId: "ordererr1" }),
    });

    expect(res.status).toBe(500);
  });
});
