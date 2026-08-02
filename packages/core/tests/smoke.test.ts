import { describe, expect, it } from "vitest";
import { discoveryLikelihood, slugify } from "../src/scan.ts";

describe("@proveit/core smoke", () => {
  it("slugify normalises idea names", () => {
    expect(slugify("ProveIt: My Great Idea")).toBe("proveit-my-great-idea");
  });

  it("discoveryLikelihood scores canonical discovery files", () => {
    const text = `# ProveIt: Test Idea

## Confidence Score
Desirability: 7/10 | Viability: 6/10 | Feasibility: 5/10
`;
    expect(discoveryLikelihood(text, "discovery.md")).toBeGreaterThanOrEqual(6);
  });
});
