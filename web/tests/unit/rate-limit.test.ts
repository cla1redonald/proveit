/**
 * Unit tests for lib/rate-limit.ts
 *
 * The integration tests reset the store in beforeEach but never exhaust the
 * limit. These tests exercise checkRateLimit and getClientIp directly so
 * the 429 path is actually covered.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// server-only guard must be mocked before importing the module
vi.mock("server-only", () => ({}));

import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
  resetRateLimitStores,
} from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitStores();
  });

  // ─── Happy path ──────────────────────────────────────────────────────────────

  it("allows the first request and returns the correct remaining count", async () => {
    const result = await checkRateLimit("1.2.3.4", "chat", 20, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19); // limit - 1
  });

  it("decrements remaining on each subsequent request", async () => {
    await checkRateLimit("1.2.3.4", "chat", 5, 60_000); // remaining: 4
    await checkRateLimit("1.2.3.4", "chat", 5, 60_000); // remaining: 3
    const result = await checkRateLimit("1.2.3.4", "chat", 5, 60_000); // remaining: 2
    expect(result.remaining).toBe(2);
  });

  it("allows exactly limit requests before blocking", async () => {
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      const r = await checkRateLimit("10.0.0.1", "chat", limit, 60_000);
      expect(r.allowed).toBe(true);
    }
    // The (limit+1)th request must be blocked
    const blocked = await checkRateLimit("10.0.0.1", "chat", limit, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  // ─── 429 path ────────────────────────────────────────────────────────────────

  it("blocks requests once the limit is exhausted", async () => {
    const { limit, windowMs } = RATE_LIMITS.chat;
    for (let i = 0; i < limit; i++) {
      await checkRateLimit("5.5.5.5", "chat", limit, windowMs);
    }
    const blocked = await checkRateLimit("5.5.5.5", "chat", limit, windowMs);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("blocks at the fast-endpoint limit (10)", async () => {
    const { limit, windowMs } = RATE_LIMITS.fast;
    for (let i = 0; i < limit; i++) {
      await checkRateLimit("6.6.6.6", "fast", limit, windowMs);
    }
    const blocked = await checkRateLimit("6.6.6.6", "fast", limit, windowMs);
    expect(blocked.allowed).toBe(false);
  });

  it("returns a resetAt timestamp in the future when blocked", async () => {
    const now = Date.now();
    const limit = 2;
    await checkRateLimit("7.7.7.7", "chat", limit, 60_000);
    await checkRateLimit("7.7.7.7", "chat", limit, 60_000);
    const blocked = await checkRateLimit("7.7.7.7", "chat", limit, 60_000);
    expect(blocked.resetAt).toBeGreaterThan(now);
  });

  // ─── Window reset ────────────────────────────────────────────────────────────

  it("resets the counter when the window expires", async () => {
    vi.useFakeTimers();

    const windowMs = 1_000; // 1-second window for the test
    await checkRateLimit("9.9.9.9", "chat", 1, windowMs); // uses the 1 allowed request
    // Exhaust the limit
    const blocked = await checkRateLimit("9.9.9.9", "chat", 1, windowMs);
    expect(blocked.allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(windowMs + 1);

    // New window — should be allowed again
    const allowed = await checkRateLimit("9.9.9.9", "chat", 1, windowMs);
    expect(allowed.allowed).toBe(true);

    vi.useRealTimers();
  });

  // ─── IP isolation ─────────────────────────────────────────────────────────────

  it("tracks different IPs independently", async () => {
    const limit = 2;
    await checkRateLimit("ip-a", "chat", limit, 60_000);
    await checkRateLimit("ip-a", "chat", limit, 60_000);
    const blockedA = await checkRateLimit("ip-a", "chat", limit, 60_000);
    expect(blockedA.allowed).toBe(false);

    // ip-b has made zero requests — must still be allowed
    const allowedB = await checkRateLimit("ip-b", "chat", limit, 60_000);
    expect(allowedB.allowed).toBe(true);
  });

  // ─── Endpoint isolation ───────────────────────────────────────────────────────

  it("tracks different endpoints independently for the same IP", async () => {
    // Exhaust "chat" for this IP
    const limit = 2;
    await checkRateLimit("shared-ip", "chat", limit, 60_000);
    await checkRateLimit("shared-ip", "chat", limit, 60_000);
    const blockedChat = await checkRateLimit("shared-ip", "chat", limit, 60_000);
    expect(blockedChat.allowed).toBe(false);

    // "fast" store is separate — should still be allowed
    const allowedFast = await checkRateLimit("shared-ip", "fast", limit, 60_000);
    expect(allowedFast.allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("extracts the first IP from X-Forwarded-For", () => {
    const req = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("returns the single IP when X-Forwarded-For has no comma", () => {
    const req = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "203.0.113.5" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("trims whitespace from the extracted IP", () => {
    const req = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "  10.0.0.1  , 192.168.1.1" },
    });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("falls back to 127.0.0.1 when X-Forwarded-For is absent", () => {
    const req = new Request("http://localhost/");
    expect(getClientIp(req)).toBe("127.0.0.1");
  });
});
