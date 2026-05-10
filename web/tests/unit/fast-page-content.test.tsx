import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FastPageContent from "@/components/fast/FastPageContent";

// Mock next/navigation — useRouter is used by FastStream for full-validation nav
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock the streaming hook so the test doesn't try to fetch
vi.mock("@/hooks/useStream", () => ({
  useStream: () => ({
    isStreaming: false,
    error: null,
    errorReason: null,
    startStream: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("FastPageContent — reset flow", () => {
  it("renders FastInput initially", () => {
    render(<FastPageContent />);
    expect(screen.getByRole("textbox", { name: /describe your product idea/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run fast check/i })).toBeInTheDocument();
  });

  it("transitions to FastStream after submitting an idea", async () => {
    const user = userEvent.setup();
    render(<FastPageContent />);

    const textarea = screen.getByRole("textbox", { name: /describe your product idea/i });
    await user.type(textarea, "An async standup tool for distributed teams");

    const runButton = screen.getByRole("button", { name: /run fast check/i });
    await user.click(runButton);

    // FastStream renders the FAST CHECK label as a section-label
    // The textarea should no longer be present
    expect(screen.queryByRole("textbox", { name: /describe your product idea/i })).not.toBeInTheDocument();
  });
});
