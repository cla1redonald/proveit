import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock the Anthropic client
vi.mock("@/lib/anthropic", () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
}));

import { POST } from "@/app/api/chat/route";
import { anthropic } from "@/lib/anthropic";
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

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when sessionId is missing", async () => {
    const req = makeRequest({ ...validPayload, sessionId: undefined });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when messages array is empty", async () => {
    const req = makeRequest({ ...validPayload, messages: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when phase is invalid", async () => {
    const req = makeRequest({ ...validPayload, phase: "invalid_phase" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when sessionId contains invalid characters", async () => {
    const req = makeRequest({ ...validPayload, sessionId: "session with spaces!" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns streaming response for valid payload", async () => {
    const mockStream = makeAsyncIterator([
      {
        type: "content_block_start",
        content_block: { type: "text" },
      },
      {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "What does your idea do?" },
      },
    ]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);

    const req = makeRequest(validPayload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
  });

  it("does not include web search tool outside research phase", async () => {
    const mockStream = makeAsyncIterator([]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);

    const req = makeRequest({ ...validPayload, phase: "brain_dump" });
    await POST(req);

    const callArgs = vi.mocked(anthropic.messages.create).mock.calls[0][0];
    expect(callArgs.tools).toBeUndefined();
  });

  it("includes web search tool during research phase", async () => {
    const mockStream = makeAsyncIterator([]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);

    const req = makeRequest({ ...validPayload, phase: "research" });
    await POST(req);

    const callArgs = vi.mocked(anthropic.messages.create).mock.calls[0][0];
    expect(callArgs.tools).toBeDefined();
    expect(callArgs.tools).toHaveLength(1);
    expect((callArgs.tools as { type: string }[])[0].type).toBe("web_search_20250305");
  });

  it("truncates messages when more than 48 (sends exactly 50, gets 48 in Anthropic call)", async () => {
    const mockStream = makeAsyncIterator([]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);

    // Zod max is 50 messages; route truncates to 48
    const manyMessages = Array.from({ length: 50 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `Message ${i}`,
    }));

    const req = makeRequest({ ...validPayload, messages: manyMessages });
    await POST(req);

    const callArgs = vi.mocked(anthropic.messages.create).mock.calls[0]?.[0];
    expect(callArgs).toBeDefined();
    expect(callArgs.messages.length).toBeLessThanOrEqual(48);
  });

  it("emits searching events for web search tool use", async () => {
    const mockStream = makeAsyncIterator([
      {
        type: "content_block_start",
        content_block: { type: "tool_use", name: "web_search" },
      },
      {
        type: "content_block_start",
        content_block: { type: "text" },
      },
      {
        type: "content_block_delta",
        delta: { type: "text_delta", text: "Research complete." },
      },
    ]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);

    const req = makeRequest({ ...validPayload, phase: "research" });
    const res = await POST(req);

    const text = await res.text();
    expect(text).toContain('"type":"searching"');
    expect(text).toContain('"active":true');
  });
});
