import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock posthog-js so the test never tries to make a network call
const captureSpy = vi.fn();
const initSpy = vi.fn();

vi.mock("posthog-js", () => ({
  default: {
    init: (...args: unknown[]) => initSpy(...args),
    capture: (...args: unknown[]) => captureSpy(...args),
    debug: vi.fn(),
  },
}));

describe("posthog lib", () => {
  beforeEach(() => {
    captureSpy.mockClear();
    initSpy.mockClear();
    vi.resetModules();
  });

  it("captureEvent is a quiet no-op when initPostHog has not run", async () => {
    const { captureEvent } = await import("@/lib/posthog");
    captureEvent("test_event");
    expect(captureSpy).not.toHaveBeenCalled();
  });

  it("captureEvent is a quiet no-op when env key is missing", async () => {
    const original = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const { initPostHog, captureEvent } = await import("@/lib/posthog");
    initPostHog();
    captureEvent("test_event");
    expect(initSpy).not.toHaveBeenCalled();
    expect(captureSpy).not.toHaveBeenCalled();
    if (original !== undefined) process.env.NEXT_PUBLIC_POSTHOG_KEY = original;
  });

  it("captureEvent fires when initPostHog has run with a key", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";
    const { initPostHog, captureEvent } = await import("@/lib/posthog");
    initPostHog();
    expect(initSpy).toHaveBeenCalledOnce();
    expect(initSpy).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({ api_host: "https://eu.i.posthog.com" })
    );
    captureEvent("validation_started", { idea_length: 42 });
    expect(captureSpy).toHaveBeenCalledWith(
      "validation_started",
      { idea_length: 42 }
    );
  });
});
