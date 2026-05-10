/**
 * Integration tests for POST /api/waitlist.
 *
 * Tests the validation, rate limiting, and success path against the
 * in-memory fallback (no Supabase env vars).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/waitlist/route";
import { resetRateLimitStores } from "@/lib/rate-limit";
import {
  resetWaitlistStores,
  _getMemoryWaitlist,
} from "@/lib/waitlist";
import { NextRequest } from "next/server";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStores();
    resetWaitlistStores();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
  });

  it("accepts a valid submission and writes to the store", async () => {
    const res = await POST(makeRequest({
      email: "alice@example.com",
      ideaExcerpt: "An AI thing",
      reason: "global_cap",
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const entries = _getMemoryWaitlist();
    expect(entries).toHaveLength(1);
    expect(entries[0].email).toBe("alice@example.com");
    expect(entries[0].reason).toBe("global_cap");
  });

  it("returns 400 on missing email", async () => {
    const res = await POST(makeRequest({
      reason: "global_cap",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 on malformed email", async () => {
    const res = await POST(makeRequest({
      email: "not-an-email",
      reason: "global_cap",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 on missing reason", async () => {
    const res = await POST(makeRequest({
      email: "alice@example.com",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid reason value", async () => {
    const res = await POST(makeRequest({
      email: "alice@example.com",
      reason: "nope",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("accepts submission without ideaExcerpt", async () => {
    const res = await POST(makeRequest({
      email: "alice@example.com",
      reason: "per_ip_cap",
    }));
    expect(res.status).toBe(200);
    expect(_getMemoryWaitlist()[0].ideaExcerpt).toBe("");
  });

  it("rate-limits after 10 submissions per minute (uses fast limiter)", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await POST(makeRequest({
        email: `user${i}@example.com`,
        reason: "global_cap",
      }));
      expect(res.status).toBe(200);
    }
    const limited = await POST(makeRequest({
      email: "eleventh@example.com",
      reason: "global_cap",
    }));
    expect(limited.status).toBe(429);
  });
});
