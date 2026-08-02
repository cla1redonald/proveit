import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ValidationSession } from "@/types";

const { mockUseSession } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
}));

vi.mock("@/lib/posthog", () => ({
  captureEvent: vi.fn(),
}));

vi.mock("@/hooks/useStream", () => ({
  useStream: () => ({
    isStreaming: false,
    error: null,
    errorReason: null,
    startStream: vi.fn().mockResolvedValue(undefined),
    stopStream: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSession", () => ({
  useSession: () => mockUseSession(),
}));

import ChatInterface from "@/components/validate/ChatInterface";

const incompleteSession: ValidationSession = {
  id: "sess_resume",
  ideaSummary: "Async standup tool for distributed engineering teams",
  phase: "discovery",
  messages: [],
  scores: { desirability: null, viability: null, feasibility: null },
  killSignals: [],
  researchComplete: false,
  createdAt: Date.now() - 3_600_000,
  updatedAt: Date.now() - 3_600_000,
};

describe("ChatInterface", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    mockUseSession.mockReturnValue({
      session: null,
      updateSession: vi.fn(),
      clearSession: vi.fn(),
    });
  });

  it("shows resume prompt for an incomplete stored session", () => {
    mockUseSession.mockReturnValue({
      session: incompleteSession,
      updateSession: vi.fn(),
      clearSession: vi.fn(),
    });

    render(<ChatInterface />);

    expect(screen.getByText("PREVIOUS SESSION")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resume session/i })).toBeInTheDocument();
    expect(screen.getByText(/Discovery in progress/i)).toBeInTheDocument();
  });

  it("validates minimum idea length before starting", async () => {
    const user = userEvent.setup();
    render(<ChatInterface />);

    await user.type(
      screen.getByRole("textbox", { name: /describe your product idea/i }),
      "Too short",
    );
    await user.click(screen.getByRole("button", { name: /start validation/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Tell us a bit more about the idea",
    );
  });

  it("shows phase indicator after starting a new session", async () => {
    const user = userEvent.setup();
    render(<ChatInterface />);

    await user.type(
      screen.getByRole("textbox", { name: /describe your product idea/i }),
      "A calendar app that schedules focus blocks for engineers automatically",
    );
    await user.click(screen.getByRole("button", { name: /start validation/i }));

    expect(await screen.findByLabelText(/Phase 1 of 4: BRAIN DUMP/i)).toBeInTheDocument();
  });
});
