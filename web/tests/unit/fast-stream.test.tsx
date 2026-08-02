import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import FastStream from "@/components/fast/FastStream";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/posthog", () => ({
  captureEvent: vi.fn(),
}));

const streamedAssumptions = `**Assumption 1: Desirability — Teams need async standups**

Verdict: SUPPORTED

Evidence:
- remote-work.com: Distributed teams report daily coordination friction

**Assumption 2: Viability — Budget exists for team tools**

Verdict: WEAK

Evidence:
- pricing-surveys.com: SMB spend remains constrained

**Quick verdict:** Desirability looks real, but monetisation is the risk.
`;

vi.mock("@/hooks/useStream", () => ({
  useStream: () => ({
    isStreaming: false,
    error: null,
    errorReason: null,
    startStream: vi.fn(async (_url, _body, onText: (chunk: string) => void) => {
      onText(streamedAssumptions);
    }),
  }),
}));

describe("FastStream", () => {
  it("renders parsed assumption cards from the stream", async () => {
    render(
      <FastStream
        idea="Async standup tool for distributed teams"
        onReset={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Teams need async standups/i)).toBeInTheDocument();
    });

    expect(screen.getByText("SUPPORTED")).toBeInTheDocument();
    expect(screen.getByText("WEAK")).toBeInTheDocument();
    expect(screen.getByText(/monetisation is the risk/i)).toBeInTheDocument();
  });
});
