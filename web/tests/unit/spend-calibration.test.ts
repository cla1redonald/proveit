import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
  logSpendCalibration,
  trackStreamUsage,
} from "@/lib/spend-calibration";

describe("spend-calibration", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logSpendCalibration emits structured JSON when usage is present", () => {
    logSpendCalibration({
      endpoint: "fast",
      estimatedUsd: 0.1,
      usage: { input_tokens: 100, output_tokens: 200 },
    });
    expect(console.info).toHaveBeenCalledWith(
      "[spend-calibration]",
      expect.stringContaining('"input_tokens":100')
    );
  });

  it("logSpendCalibration skips when usage is missing or zero", () => {
    logSpendCalibration({
      endpoint: "chat",
      phase: "research",
      estimatedUsd: 0.5,
      usage: null,
    });
    logSpendCalibration({
      endpoint: "chat",
      estimatedUsd: 0.05,
      usage: { input_tokens: 0, output_tokens: 0 },
    });
    expect(console.info).not.toHaveBeenCalled();
  });

  it("trackStreamUsage accumulates input from message_start and output from message_delta", () => {
    const usage = { input_tokens: 0, output_tokens: 0 };
    trackStreamUsage(
      {
        type: "message_start",
        message: { usage: { input_tokens: 512, output_tokens: 0 } },
      },
      usage
    );
    trackStreamUsage(
      {
        type: "message_delta",
        usage: { input_tokens: 512, output_tokens: 1024 },
      },
      usage
    );
    expect(usage).toEqual({ input_tokens: 512, output_tokens: 1024 });
  });
});
