import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock posthog-js so the test never tries to make a network call
const captureSpy = vi.fn();
const captureExceptionSpy = vi.fn();
const initSpy = vi.fn();
const clearOptOutSpy = vi.fn();
const optOutSpy = vi.fn();
const resetSpy = vi.fn();
const localStore = new Map<string, string>();

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => localStore.get(key) ?? null,
    setItem: (key: string, value: string) => localStore.set(key, value),
    removeItem: (key: string) => localStore.delete(key),
    clear: () => localStore.clear(),
  },
});

vi.mock("posthog-js", () => ({
  default: {
    init: (...args: unknown[]) => initSpy(...args),
    capture: (...args: unknown[]) => captureSpy(...args),
    captureException: (...args: unknown[]) => captureExceptionSpy(...args),
    clear_opt_in_out_capturing: () => clearOptOutSpy(),
    opt_out_capturing: () => optOutSpy(),
    reset: () => resetSpy(),
    debug: vi.fn(),
  },
}));

describe("posthog lib", () => {
  beforeEach(() => {
    captureSpy.mockClear();
    captureExceptionSpy.mockClear();
    initSpy.mockClear();
    clearOptOutSpy.mockClear();
    optOutSpy.mockClear();
    resetSpy.mockClear();
    localStore.clear();
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
    vi.resetModules();
  });

  it("does not initialise before analytics consent", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
    const { initPostHog } = await import("@/lib/posthog");
    initPostHog();
    expect(initSpy).not.toHaveBeenCalled();
  });

  it("captureEvent is a quiet no-op when initPostHog has not run", async () => {
    const { captureEvent } = await import("@/lib/posthog");
    captureEvent("test_event");
    expect(captureSpy).not.toHaveBeenCalled();
  });

  it("captureEvent is a quiet no-op when env key is missing", async () => {
    const { initPostHog, captureEvent } = await import("@/lib/posthog");
    initPostHog();
    captureEvent("test_event");
    expect(initSpy).not.toHaveBeenCalled();
    expect(captureSpy).not.toHaveBeenCalled();
  });

  it("captureEvent fires after consent and initialisation", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";
    const { grantAnalyticsConsent, captureEvent } = await import("@/lib/posthog");
    grantAnalyticsConsent();
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

  it("stops capture when analytics consent is revoked", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
    const { grantAnalyticsConsent, revokeAnalyticsConsent, captureEvent } =
      await import("@/lib/posthog");
    grantAnalyticsConsent();
    revokeAnalyticsConsent();
    captureEvent("after_revoke");
    expect(optOutSpy).toHaveBeenCalledOnce();
    expect(resetSpy).toHaveBeenCalledOnce();
    expect(captureSpy).not.toHaveBeenCalled();
  });
});
