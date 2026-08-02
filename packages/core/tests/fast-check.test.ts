import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseFastCheckNote, scanFastChecks } from "../src/fast-check.ts";

const FIXTURES = join(import.meta.dirname, "fixtures", "fast-check");

describe("parseFastCheckNote", () => {
  it("parses multi-idea fast-check notes", async () => {
    const text = await readFile(join(FIXTURES, "portfolio-fast.md"), "utf8");
    const ideas = parseFastCheckNote(text, "portfolio-fast.md");

    expect(ideas).toHaveLength(2);
    expect(ideas[0].name).toBe("Rooftop Beekeeping SaaS");
    expect(ideas[0].verdict).toMatch(/weak/i);
    expect(ideas[0].assessments.length).toBeGreaterThanOrEqual(2);
    expect(ideas[0].insight).toMatch(/B2B apiary/i);
    expect(ideas[0].date).toBe("2026-07-15");
    expect(ideas[1].slug).toBe("ai-resume-rewriter");
  });

  it("skips sections without enough dimension verdicts", () => {
    const text = `# /proveit-fast on 2026-01-01

## Incomplete Section

**Verdict: Weak**

- Only one line here
`;
    expect(parseFastCheckNote(text, "incomplete.md")).toHaveLength(0);
  });
});

describe("scanFastChecks", () => {
  it("finds fast-check notes by content markers", async () => {
    const ideas = await scanFastChecks([FIXTURES]);
    expect(ideas.length).toBeGreaterThanOrEqual(2);
    expect(ideas.every((i) => i.source.includes("portfolio-fast.md"))).toBe(true);
  });
});
