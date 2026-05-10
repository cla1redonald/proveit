/**
 * Unit tests for lib/waitlist.ts (in-memory fallback path).
 *
 * The Supabase path is exercised in production; these tests verify the
 * in-memory fallback used in dev + tests is correct, plus the input
 * normalisation (email lowercased, idea excerpt truncated).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  addToWaitlist,
  resetWaitlistStores,
  _getMemoryWaitlist,
} from "@/lib/waitlist";

describe("addToWaitlist (in-memory fallback)", () => {
  beforeEach(() => {
    resetWaitlistStores();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
  });

  it("appends an entry to the in-memory store when Supabase env is unset", async () => {
    await addToWaitlist({
      email: "test@example.com",
      ideaExcerpt: "An idea",
      reason: "global_cap",
      ip: "1.2.3.4",
    });

    const entries = _getMemoryWaitlist();
    expect(entries).toHaveLength(1);
    expect(entries[0].email).toBe("test@example.com");
    expect(entries[0].reason).toBe("global_cap");
    expect(entries[0].ip).toBe("1.2.3.4");
    expect(entries[0].ideaExcerpt).toBe("An idea");
    expect(entries[0].ts).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO timestamp
  });

  it("lowercases and trims emails", async () => {
    await addToWaitlist({
      email: "  TEST@Example.COM  ",
      reason: "per_ip_cap",
      ip: "1.1.1.1",
    });
    expect(_getMemoryWaitlist()[0].email).toBe("test@example.com");
  });

  it("truncates idea excerpt to 200 chars", async () => {
    const longIdea = "x".repeat(500);
    await addToWaitlist({
      email: "test@example.com",
      ideaExcerpt: longIdea,
      reason: "global_cap",
      ip: "1.1.1.1",
    });
    expect(_getMemoryWaitlist()[0].ideaExcerpt).toHaveLength(200);
  });

  it("handles a missing idea excerpt cleanly", async () => {
    await addToWaitlist({
      email: "test@example.com",
      reason: "global_cap",
      ip: "1.1.1.1",
    });
    expect(_getMemoryWaitlist()[0].ideaExcerpt).toBe("");
  });

  it("captures both reason types", async () => {
    await addToWaitlist({ email: "a@x.com", reason: "global_cap", ip: "1.1.1.1" });
    await addToWaitlist({ email: "b@x.com", reason: "per_ip_cap", ip: "2.2.2.2" });
    const entries = _getMemoryWaitlist();
    expect(entries).toHaveLength(2);
    expect(entries[0].reason).toBe("global_cap");
    expect(entries[1].reason).toBe("per_ip_cap");
  });

  it("resetWaitlistStores clears between tests", async () => {
    await addToWaitlist({ email: "a@x.com", reason: "global_cap", ip: "1.1.1.1" });
    expect(_getMemoryWaitlist()).toHaveLength(1);
    resetWaitlistStores();
    expect(_getMemoryWaitlist()).toHaveLength(0);
  });
});
