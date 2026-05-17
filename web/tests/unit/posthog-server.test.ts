import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// server-only guard must be mocked before importing the module
vi.mock("server-only", () => ({}));

const captureExceptionMock = vi.fn();

vi.mock("posthog-node", () => ({
  PostHog: vi.fn().mockImplementation(() => ({
    captureException: captureExceptionMock,
  })),
}));

import {
  getPostHogServer,
  captureServerException,
  resetPostHogServer,
} from "@/lib/posthog-server";

describe("posthog-server", () => {
  beforeEach(() => {
    resetPostHogServer();
    captureExceptionMock.mockClear();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  it("returns null and warns when NEXT_PUBLIC_POSTHOG_KEY is unset", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = getPostHogServer();
    expect(client).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_POSTHOG_KEY unset"),
    );
    warn.mockRestore();
  });

  it("captureServerException is a quiet no-op when key is unset", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      captureServerException(new Error("boom"), { route: "/api/x" }),
    ).resolves.toBeUndefined();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("forwards Error + properties + distinctId when key is set", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
    const err = new Error("anthropic exploded");
    await captureServerException(err, { route: "/api/chat" }, "user-123");
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    const [sentErr, distinctId, props] = captureExceptionMock.mock.calls[0];
    expect(sentErr).toBe(err);
    expect(distinctId).toBe("user-123");
    expect(props).toEqual({ route: "/api/chat" });
  });

  it("wraps non-Error values in Error before sending", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
    await captureServerException("string error", { route: "/api/fast" });
    const [sentErr] = captureExceptionMock.mock.calls[0];
    expect(sentErr).toBeInstanceOf(Error);
    expect((sentErr as Error).message).toBe("string error");
  });

  it("swallows internal capture errors without throwing", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
    captureExceptionMock.mockRejectedValueOnce(new Error("network down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      captureServerException(new Error("first"), { route: "/api/chat" }),
    ).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
