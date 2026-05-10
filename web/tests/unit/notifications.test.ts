/**
 * Unit tests for lib/notifications.ts
 *
 * Verifies: env-var gating (silent no-op when unset), Resend SDK invocation
 * with the right shape, error handling (fire-and-forget — never throws).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Mock the Resend SDK at module level
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

import { notifyWaitlistSignup, resetNotificationClient } from "@/lib/notifications";

describe("notifyWaitlistSignup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetNotificationClient();
    delete process.env.RESEND_API_KEY;
    delete process.env.WAITLIST_NOTIFY_EMAIL;
    delete process.env.WAITLIST_FROM_EMAIL;
  });

  it("silent no-op when RESEND_API_KEY is unset", async () => {
    process.env.WAITLIST_NOTIFY_EMAIL = "claire@example.com";
    await notifyWaitlistSignup({
      email: "user@example.com",
      ideaExcerpt: "An idea",
      reason: "global_cap",
      ip: "1.2.3.4",
      ts: "2026-05-10T08:00:00Z",
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("silent no-op when WAITLIST_NOTIFY_EMAIL is unset", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    await notifyWaitlistSignup({
      email: "user@example.com",
      ideaExcerpt: "An idea",
      reason: "global_cap",
      ip: "1.2.3.4",
      ts: "2026-05-10T08:00:00Z",
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends an email when both env vars are set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.WAITLIST_NOTIFY_EMAIL = "claire@example.com";
    mockSend.mockResolvedValue({ data: { id: "msg_123" }, error: null });

    await notifyWaitlistSignup({
      email: "user@example.com",
      ideaExcerpt: "An interesting idea",
      reason: "global_cap",
      ip: "1.2.3.4",
      ts: "2026-05-10T08:00:00Z",
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.to).toEqual(["claire@example.com"]);
    expect(callArgs.replyTo).toBe("user@example.com"); // hit Reply → submitter
    expect(callArgs.subject).toContain("user@example.com");
    expect(callArgs.html).toContain("user@example.com");
    expect(callArgs.text).toContain("user@example.com");
    expect(callArgs.text).toContain("Global daily cap");
  });

  it("uses default from address when WAITLIST_FROM_EMAIL is unset", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.WAITLIST_NOTIFY_EMAIL = "claire@example.com";
    mockSend.mockResolvedValue({ data: { id: "msg_123" }, error: null });

    await notifyWaitlistSignup({
      email: "user@example.com",
      ideaExcerpt: "",
      reason: "per_ip_cap",
      ip: "1.2.3.4",
      ts: "2026-05-10T08:00:00Z",
    });

    expect(mockSend.mock.calls[0][0].from).toBe("onboarding@resend.dev");
  });

  it("uses configured from address when WAITLIST_FROM_EMAIL is set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.WAITLIST_NOTIFY_EMAIL = "claire@example.com";
    process.env.WAITLIST_FROM_EMAIL = "noreply@roami.group";
    mockSend.mockResolvedValue({ data: { id: "msg_123" }, error: null });

    await notifyWaitlistSignup({
      email: "user@example.com",
      ideaExcerpt: "",
      reason: "per_ip_cap",
      ip: "1.2.3.4",
      ts: "2026-05-10T08:00:00Z",
    });

    expect(mockSend.mock.calls[0][0].from).toBe("noreply@roami.group");
  });

  it("escapes HTML in the email body to prevent injection", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.WAITLIST_NOTIFY_EMAIL = "claire@example.com";
    mockSend.mockResolvedValue({ data: { id: "msg_123" }, error: null });

    await notifyWaitlistSignup({
      email: "<script>alert(1)</script>@example.com",
      ideaExcerpt: "<img src=x onerror=alert(1)>",
      reason: "global_cap",
      ip: "1.2.3.4",
      ts: "2026-05-10T08:00:00Z",
    });

    const html = mockSend.mock.calls[0][0].html;
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("swallows Resend send errors — never throws to caller", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.WAITLIST_NOTIFY_EMAIL = "claire@example.com";
    mockSend.mockRejectedValue(new Error("Resend exploded"));

    // Must not throw
    await expect(
      notifyWaitlistSignup({
        email: "user@example.com",
        ideaExcerpt: "",
        reason: "global_cap",
        ip: "1.2.3.4",
        ts: "2026-05-10T08:00:00Z",
      })
    ).resolves.toBeUndefined();
  });

  it("swallows Resend error responses (non-thrown) — never throws", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.WAITLIST_NOTIFY_EMAIL = "claire@example.com";
    mockSend.mockResolvedValue({ data: null, error: { message: "rate limited", name: "rate_limit_exceeded" } });

    await expect(
      notifyWaitlistSignup({
        email: "user@example.com",
        ideaExcerpt: "",
        reason: "global_cap",
        ip: "1.2.3.4",
        ts: "2026-05-10T08:00:00Z",
      })
    ).resolves.toBeUndefined();
  });
});
