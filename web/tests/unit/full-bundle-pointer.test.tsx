import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FullBundlePointer from "@/components/validate/FullBundlePointer";

describe("FullBundlePointer", () => {
  it("links to Claude Code with the right href and target attributes", () => {
    render(<FullBundlePointer />);
    const link = screen.getByRole("link", { name: /claude code/i });
    expect(link).toHaveAttribute("href", "https://claude.com/claude-code");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("mentions the new artefacts the bundle contains", () => {
    const { container } = render(<FullBundlePointer />);
    const text = container.textContent ?? "";
    expect(text).toContain("discovery.md");
    expect(text).toContain("brand.md");
    expect(text).toContain("spec.md");
    expect(text).toContain("design-brief.md");
    expect(text).toContain("Claude Design prompts");
  });

  it("describes the CLI alternative as free", () => {
    render(<FullBundlePointer />);
    expect(screen.getByText(/free, full pipeline/i)).toBeInTheDocument();
  });
});
