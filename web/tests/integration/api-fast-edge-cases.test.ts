/**
 * Edge case integration tests for POST /api/fast.
 *
 * The existing api-fast.test.ts covers the basic validation and happy path.
 * This file targets:
 *   - Boundary values (exactly 10 chars, exactly 2000 chars)
 *   - Whitespace-only idea (trimmed to empty → 400)
 *   - Idea that is only whitespace padded but meets min after trim
 *   - Anthropic error codes propagated through stream (401, 429, 529, generic)
 *   - Response headers are correct
 *   - Idea at exactly the minimum boundary (10 chars) passes
 *   - Idea at 9 chars fails
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/anthropic", () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
}));

import { POST } from "@/app/api/fast/route";
import { anthropic } from "@/lib/anthropic";
import { resetRateLimitStores } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/fast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeAsyncIterator(chunks: string[]) {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < chunks.length) {
            return {
              done: false,
              value: {
                type: "content_block_delta",
                delta: { type: "text_delta", text: chunks[i++] },
              },
            };
          }
          return { done: true, value: undefined };
        },
      };
    },
  };
}

function makeErrorIterator(err: object) {
  return {
    [Symbol.asyncIterator]() {
      return {
        async next(): Promise<{ done: boolean; value: unknown }> {
          throw Object.assign(new Error("Anthropic error"), err);
        },
      };
    },
  };
}

describe("POST /api/fast — boundary and error cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStores();
  });

  // ─── Boundary values ────────────────────────────────────────────────────────

  it("returns 400 for idea of exactly 9 characters", async () => {
    const req = makeRequest({ idea: "123456789" }); // 9 chars
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("accepts idea of exactly 10 characters (minimum boundary)", async () => {
    const mockStream = makeAsyncIterator(["ok"]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const req = makeRequest({ idea: "1234567890" }); // exactly 10 chars
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("accepts idea of exactly 2000 characters (maximum boundary)", async () => {
    const mockStream = makeAsyncIterator(["ok"]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const req = makeRequest({ idea: "a".repeat(2000) });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 for idea of exactly 2001 characters", async () => {
    const req = makeRequest({ idea: "a".repeat(2001) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for whitespace-only idea (trimmed to empty)", async () => {
    // The Zod schema trims before checking min(10)
    const req = makeRequest({ idea: "          " }); // 10 spaces — trimmed to ""
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for idea that is only tabs and newlines", async () => {
    const req = makeRequest({ idea: "\t\n\t\n\t\n\t\n\t\n" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("accepts idea with leading/trailing whitespace that is 10+ chars after trim", async () => {
    const mockStream = makeAsyncIterator(["ok"]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    // "  1234567890  " — trimmed = "1234567890" (10 chars)
    const req = makeRequest({ idea: "  1234567890  " });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // ─── Non-string idea ────────────────────────────────────────────────────────

  it("returns 400 when idea is a number", async () => {
    const req = makeRequest({ idea: 12345 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when idea is null", async () => {
    const req = makeRequest({ idea: null });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when idea is an array", async () => {
    const req = makeRequest({ idea: ["an", "idea"] });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ─── Response headers ───────────────────────────────────────────────────────

  it("sets correct Content-Type and Cache-Control headers on success", async () => {
    const mockStream = makeAsyncIterator(["text"]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const req = makeRequest({ idea: "A valid idea that is long enough to pass" });
    const res = await POST(req);
    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
  });

  // ─── Anthropic error propagation through stream ─────────────────────────────

  it("emits searching error event in stream on Anthropic 401", async () => {
    vi.mocked(anthropic.messages.create).mockRejectedValue(
      Object.assign(new Error("Unauthorized"), { status: 401 })
    );
    const req = makeRequest({ idea: "A valid idea that is long enough to test errors" });
    const res = await POST(req);
    expect(res.status).toBe(200); // stream starts, error injected into body
    const text = await res.text();
    expect(text).toContain('"type":"error"');
    expect(text).toContain("configuration error");
  });

  it("emits rate limit error event in stream on Anthropic 429", async () => {
    vi.mocked(anthropic.messages.create).mockRejectedValue(
      Object.assign(new Error("Rate limited"), { status: 429 })
    );
    const req = makeRequest({ idea: "A valid idea that is long enough to test errors" });
    const res = await POST(req);
    const text = await res.text();
    expect(text).toContain('"type":"error"');
    expect(text).toContain("Rate limit");
  });

  it("emits overload error event in stream on Anthropic 529", async () => {
    vi.mocked(anthropic.messages.create).mockRejectedValue(
      Object.assign(new Error("Overloaded"), { status: 529 })
    );
    const req = makeRequest({ idea: "A valid idea that is long enough to test errors" });
    const res = await POST(req);
    const text = await res.text();
    expect(text).toContain('"type":"error"');
    expect(text).toContain("high load");
  });

  it("emits generic error event in stream on unknown Anthropic error", async () => {
    vi.mocked(anthropic.messages.create).mockRejectedValue(
      Object.assign(new Error("Unexpected"), { status: 500 })
    );
    const req = makeRequest({ idea: "A valid idea that is long enough to test errors" });
    const res = await POST(req);
    const text = await res.text();
    expect(text).toContain('"type":"error"');
    expect(text).toContain("Something went wrong");
  });

  it("emits error event in stream when iterator throws mid-stream", async () => {
    const failingIterator = makeErrorIterator({ status: 500 });
    vi.mocked(anthropic.messages.create).mockResolvedValue(failingIterator as never);
    const req = makeRequest({ idea: "A valid idea that is long enough to test errors" });
    const res = await POST(req);
    // Stream should close without throwing — error event emitted
    const text = await res.text();
    expect(text).toContain('"type":"error"');
  });

  // ─── In-process rate limiting (429) ─────────────────────────────────────────
  // The fast endpoint has its own rate limiter (10 req / 60s) independent of chat.

  it("returns 429 after the fast rate limit is exhausted", async () => {
    const mockStream = makeAsyncIterator(["ok"]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);

    const idea = "A valid idea that is long enough to pass validation checks";
    for (let i = 0; i < 10; i++) {
      await POST(makeRequest({ idea }));
    }

    const res = await POST(makeRequest({ idea }));
    expect(res.status).toBe(429);
  });

  it("429 response body contains an error message", async () => {
    const mockStream = makeAsyncIterator(["ok"]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);

    const idea = "A valid idea that is long enough to pass validation checks";
    for (let i = 0; i < 10; i++) {
      await POST(makeRequest({ idea }));
    }

    const res = await POST(makeRequest({ idea }));
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("429 response includes Retry-After header with a positive value", async () => {
    const mockStream = makeAsyncIterator(["ok"]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);

    const idea = "A valid idea that is long enough to pass validation checks";
    for (let i = 0; i < 10; i++) {
      await POST(makeRequest({ idea }));
    }

    const res = await POST(makeRequest({ idea }));
    const retryAfter = res.headers.get("Retry-After");
    expect(retryAfter).not.toBeNull();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });

  it("does not call Anthropic when the fast rate limit is exceeded", async () => {
    const mockStream = makeAsyncIterator(["ok"]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);

    const idea = "A valid idea that is long enough to pass validation checks";
    for (let i = 0; i < 10; i++) {
      await POST(makeRequest({ idea }));
    }
    vi.clearAllMocks();

    await POST(makeRequest({ idea }));
    expect(vi.mocked(anthropic.messages.create)).not.toHaveBeenCalled();
  });
});
