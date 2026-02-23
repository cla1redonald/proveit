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
  const encoder = new TextEncoder();
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

describe("POST /api/fast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStores();
  });

  it("returns 400 when idea is too short", async () => {
    const req = makeRequest({ idea: "short" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 400 when idea is empty", async () => {
    const req = makeRequest({ idea: "" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when idea is missing", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/fast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns streaming response for valid idea", async () => {
    const mockStream = makeAsyncIterator(["Hello, ", "world!"]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);

    const req = makeRequest({
      idea: "A task management tool for remote teams that integrates with Slack",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
  });

  it("streams text content from Anthropic response", async () => {
    const mockStream = makeAsyncIterator(["Assumption 1:", " Desirability"]);
    vi.mocked(anthropic.messages.create).mockResolvedValue(mockStream as never);

    const req = makeRequest({
      idea: "A project management tool for small creative agencies and freelancers",
    });
    const res = await POST(req);

    const text = await res.text();
    expect(text).toContain("Assumption 1:");
  });

  it("returns 400 when idea exceeds 2000 chars", async () => {
    const req = makeRequest({ idea: "a".repeat(2001) });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("2000 characters");
  });
});
