import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DownloadButton from "@/components/validate/DownloadButton";
import type { ValidationSession } from "@/types";

const session: ValidationSession = {
  id: "sess_download",
  ideaSummary: "Async standup tool for distributed teams",
  phase: "complete",
  messages: [
    {
      id: "m1",
      role: "assistant",
      content: "Summary content for the download.",
      timestamp: Date.now(),
    },
  ],
  scores: { desirability: 7, viability: 6, feasibility: 5 },
  killSignals: [],
  researchComplete: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe("DownloadButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(global.URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => "blob:proveit-test"),
    });
    Object.defineProperty(global.URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  it("generates and triggers a markdown download", async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, "createElement").mockImplementation((tagName, options) => {
      const el = originalCreateElement(tagName, options);
      if (tagName === "a") {
        el.click = click;
      }
      return el;
    });

    render(<DownloadButton session={session} />);
    await user.click(screen.getByRole("button", { name: /download summary/i }));

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });
});
