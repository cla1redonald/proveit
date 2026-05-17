import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PhaseIndicator from "@/components/validate/PhaseIndicator";

describe("PhaseIndicator", () => {
  it("renders the mobile compact label (current phase + step counter)", () => {
    render(<PhaseIndicator phase="brain_dump" />);
    const compact = screen.getByLabelText(/Phase 1 of 4: BRAIN DUMP/);
    expect(compact).toBeInTheDocument();
    expect(compact.parentElement?.className).toContain("sm:hidden");
  });

  it("renders the full chain for sm+ viewports (all 4 labels present)", () => {
    render(<PhaseIndicator phase="discovery" />);
    expect(screen.getAllByText("BRAIN DUMP").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DISCOVERY").length).toBeGreaterThan(0);
    expect(screen.getAllByText("RESEARCH").length).toBeGreaterThan(0);
    expect(screen.getAllByText("RESULTS").length).toBeGreaterThan(0);
  });

  it("marks the correct active step on the mobile label across phases", () => {
    const { rerender } = render(<PhaseIndicator phase="research" />);
    expect(screen.getByLabelText(/Phase 3 of 4: RESEARCH/)).toBeInTheDocument();

    rerender(<PhaseIndicator phase="findings" />);
    expect(screen.getByLabelText(/Phase 4 of 4: RESULTS/)).toBeInTheDocument();

    rerender(<PhaseIndicator phase="complete" />);
    expect(screen.getByLabelText(/Phase 4 of 4: RESULTS/)).toBeInTheDocument();
  });
});
