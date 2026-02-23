/**
 * Edge case integration tests for POST /api/chat.
 *
 * The existing api-chat.test.ts covers basic validation and the happy path.
 * This file targets:
 *   - sessionId boundary: empty string, exactly 100 chars, 101 chars
 *   - sessionId with invalid characters (dots, underscores, unicode)
 *   - messages array exactly at limit (50 messages)
 *   - single message that is exactly 10000 chars (max)
 *   - single message that is 10001 chars (over max)
 *   - scores out of Zod range (0, 11)
 *   - scores as strings instead of numbers
 *   - searching:false event emitted when text block resumes after tool use
 *   - done event emitted at end of successful stream
 *   - Anthropic error codes (401, 429, 529, context_window_exceeded) in stream
 *   - context window error message contains expected text
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

import { POST } from "@/app/api/chat/route";
import { anthropic } from "@/lib/anthropic";
import { resetRateLimitStores } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  sessionId: "test-session-123",
  messages: [
    { role: "user", content: "I want to build a habit tracker for remote teams" },
  ],
  phase: "brain_dump",
  scores: { desirability: null, viability: null, feasibility: null },
};

function makeAsyncIterator(events: unknown[]) {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < events.length) {
            return { done: false, value: events[i++] };
          }
          return { done: true, value: undefined };
        },
      };
    },
  };
}

describe("POST /api/chat — edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStores();
  });

  // ─── sessionId boundaries ───────────────────────────────────────────────────

  it("returns 400 for empty sessionId string", async () => {
    const req = makeRequest({ ...validPayload, sessionId: "" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("accepts sessionId of exactly 100 alphanumeric characters", async () => {
    const mockStream = makeAsyncIterator([]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const req = makeRequest({ ...validPayload, sessionId: "a".repeat(100) });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 for sessionId of 101 characters", async () => {
    const req = makeRequest({ ...validPayload, sessionId: "a".repeat(101) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for sessionId with dots", async () => {
    const req = makeRequest({ ...validPayload, sessionId: "session.with.dots" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("accepts sessionId with underscores (nanoid default alphabet includes _)", async () => {
    const mockStream = makeAsyncIterator([]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const req = makeRequest({ ...validPayload, sessionId: "session_with_underscores" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("accepts sessionId with hyphens (valid per spec)", async () => {
    const mockStream = makeAsyncIterator([]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const req = makeRequest({ ...validPayload, sessionId: "session-with-hyphens-123" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 for sessionId with unicode characters", async () => {
    const req = makeRequest({ ...validPayload, sessionId: "session-\u00e9-test" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ─── messages array boundaries ──────────────────────────────────────────────

  it("accepts messages array of exactly 50 items (Zod max)", async () => {
    const mockStream = makeAsyncIterator([]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const fiftyMessages = Array.from({ length: 50 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `Message ${i + 1}`,
    }));
    const req = makeRequest({ ...validPayload, messages: fiftyMessages });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 for messages array of 51 items (exceeds Zod max)", async () => {
    const fiftyOneMessages = Array.from({ length: 51 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `Message ${i + 1}`,
    }));
    const req = makeRequest({ ...validPayload, messages: fiftyOneMessages });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ─── message content boundaries ─────────────────────────────────────────────

  it("accepts message content of exactly 10000 characters", async () => {
    const mockStream = makeAsyncIterator([]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const req = makeRequest({
      ...validPayload,
      messages: [{ role: "user", content: "a".repeat(10000) }],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 for message content of 10001 characters", async () => {
    const req = makeRequest({
      ...validPayload,
      messages: [{ role: "user", content: "a".repeat(10001) }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for message with empty content", async () => {
    const req = makeRequest({
      ...validPayload,
      messages: [{ role: "user", content: "" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ─── scores validation ───────────────────────────────────────────────────────

  it("returns 400 when a score is 0 (below minimum of 1)", async () => {
    const req = makeRequest({
      ...validPayload,
      scores: { desirability: 0, viability: null, feasibility: null },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when a score is 11 (above maximum of 10)", async () => {
    const req = makeRequest({
      ...validPayload,
      scores: { desirability: 11, viability: null, feasibility: null },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when a score is a string instead of number", async () => {
    const req = makeRequest({
      ...validPayload,
      scores: { desirability: "7", viability: null, feasibility: null },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("accepts scores of exactly 1 (minimum boundary)", async () => {
    const mockStream = makeAsyncIterator([]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const req = makeRequest({
      ...validPayload,
      scores: { desirability: 1, viability: 1, feasibility: 1 },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("accepts scores of exactly 10 (maximum boundary)", async () => {
    const mockStream = makeAsyncIterator([]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const req = makeRequest({
      ...validPayload,
      scores: { desirability: 10, viability: 10, feasibility: 10 },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // ─── Stream event correctness ────────────────────────────────────────────────

  it("emits done event at end of successful stream", async () => {
    const mockStream = makeAsyncIterator([
      {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "Hello." },
      },
    ]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const req = makeRequest(validPayload);
    const res = await POST(req);
    const text = await res.text();
    expect(text).toContain('"type":"done"');
  });

  it("emits searching:false after text block resumes post web search", async () => {
    // Sequence: tool_use block → text block (signals searching:false)
    const mockStream = makeAsyncIterator([
      {
        type: "content_block_start",
        content_block: { type: "tool_use", name: "web_search" },
      },
      {
        // First text block — textBlockStarted is false, so no searching:false yet
        type: "content_block_start",
        content_block: { type: "text" },
      },
      {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "Some text." },
      },
      {
        // Second text block after search — textBlockStarted is true, signals false
        type: "content_block_start",
        content_block: { type: "text" },
      },
      {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "Search results here." },
      },
    ]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const req = makeRequest({ ...validPayload, phase: "research" });
    const res = await POST(req);
    const text = await res.text();
    // Both searching:true and searching:false must be present
    expect(text).toContain('"active":true');
    expect(text).toContain('"active":false');
  });

  // ─── Anthropic error propagation ─────────────────────────────────────────────

  it("emits context_window_exceeded error event in stream", async () => {
    vi.mocked(anthropic.messages.create).mockRejectedValue(
      Object.assign(new Error("context_window_exceeded"), { status: 400 })
    );
    const req = makeRequest(validPayload);
    const res = await POST(req);
    const text = await res.text();
    expect(text).toContain('"type":"error"');
    expect(text).toContain("Conversation too long");
  });

  it("emits 401 configuration error event in stream", async () => {
    vi.mocked(anthropic.messages.create).mockRejectedValue(
      Object.assign(new Error("Unauthorized"), { status: 401 })
    );
    const req = makeRequest(validPayload);
    const res = await POST(req);
    const text = await res.text();
    expect(text).toContain('"type":"error"');
    expect(text).toContain("configuration error");
  });

  it("emits 429 rate limit error event in stream", async () => {
    vi.mocked(anthropic.messages.create).mockRejectedValue(
      Object.assign(new Error("Rate limited"), { status: 429 })
    );
    const req = makeRequest(validPayload);
    const res = await POST(req);
    const text = await res.text();
    expect(text).toContain('"type":"error"');
    expect(text).toContain("Rate limit");
  });

  it("emits 529 overload error event in stream", async () => {
    vi.mocked(anthropic.messages.create).mockRejectedValue(
      Object.assign(new Error("Overloaded"), { status: 529 })
    );
    const req = makeRequest(validPayload);
    const res = await POST(req);
    const text = await res.text();
    expect(text).toContain('"type":"error"');
    expect(text).toContain("high load");
  });

  it("emits generic error event for unrecognised Anthropic error", async () => {
    vi.mocked(anthropic.messages.create).mockRejectedValue(
      Object.assign(new Error("Unexpected"), { status: 503 })
    );
    const req = makeRequest(validPayload);
    const res = await POST(req);
    const text = await res.text();
    expect(text).toContain('"type":"error"');
    expect(text).toContain("Something went wrong");
  });

  // ─── Truncation boundary ─────────────────────────────────────────────────────

  it("sends exactly 48 messages to Anthropic when 48 are provided (no truncation)", async () => {
    const mockStream = makeAsyncIterator([]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const fortyEight = Array.from({ length: 48 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `Message ${i + 1}`,
    }));
    const req = makeRequest({ ...validPayload, messages: fortyEight });
    await POST(req);
    const callArgs = vi.mocked(anthropic.messages.create).mock.calls[0][0];
    expect(callArgs.messages.length).toBe(48);
  });

  it("keeps the LAST 48 messages when 50 are sent (oldest 2 dropped)", async () => {
    const mockStream = makeAsyncIterator([]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);
    const fifty = Array.from({ length: 50 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `Message ${i}`,
    }));
    const req = makeRequest({ ...validPayload, messages: fifty });
    await POST(req);
    const callArgs = vi.mocked(anthropic.messages.create).mock.calls[0][0];
    // The 48 messages kept should be the last 48 (index 2..49)
    expect(callArgs.messages.length).toBe(48);
    expect(callArgs.messages[0].content).toBe("Message 2");
    expect(callArgs.messages[47].content).toBe("Message 49");
  });
});
