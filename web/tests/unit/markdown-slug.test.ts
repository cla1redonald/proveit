/**
 * Tests for the slug generation logic in DownloadButton and the
 * generateDiscoveryMarkdown edge cases in markdown.ts.
 *
 * The slug is computed inline in DownloadButton.tsx:
 *   session.ideaSummary
 *     .toLowerCase()
 *     .split(/\s+/)
 *     .slice(0, 4)
 *     .join("-")
 *     .replace(/[^a-z0-9-]/g, "")
 *     .slice(0, 40)
 *
 * We extract and test that logic directly so it doesn't need DOM / React.
 */
import { describe, it, expect } from "vitest";
import { generateDiscoveryMarkdown } from "@/lib/markdown";
import type { ValidationSession } from "@/types";

// ─── Pure slug helper (mirrors DownloadButton inline logic) ──────────────────

function buildSlug(ideaSummary: string): string {
  return ideaSummary
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 4)
    .join("-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
}

const baseSession: ValidationSession = {
  id: "slug-test-001",
  ideaSummary: "",
  phase: "complete",
  messages: [],
  scores: { desirability: null, viability: null, feasibility: null },
  killSignals: [],
  researchComplete: false,
  createdAt: 1740000000000,
  updatedAt: 1740000100000,
};

// ─── Slug edge cases ──────────────────────────────────────────────────────────

describe("DownloadButton — slug generation edge cases", () => {
  it("produces a non-empty slug from a normal idea summary", () => {
    const slug = buildSlug("A habit tracker for remote teams");
    expect(slug).toBe("a-habit-tracker-for");
  });

  it("limits to the first 4 words", () => {
    const slug = buildSlug("one two three four five six");
    expect(slug).toBe("one-two-three-four");
  });

  it("returns an empty string when ideaSummary is empty", () => {
    const slug = buildSlug("");
    // split("") → [""] → slice(0,4) → [""] → join → "" → replace → "" → slice → ""
    expect(slug).toBe("");
  });

  it("strips all special characters leaving only alphanumeric and hyphens", () => {
    const slug = buildSlug("!@#$ %^&* ()[]{}");
    // Every word becomes empty after stripping, joined by hyphens
    // Result is hyphens only — still valid, doesn't throw
    expect(typeof slug).toBe("string");
    // All chars must be a-z, 0-9, or -
    expect(slug).toMatch(/^[a-z0-9-]*$/);
  });

  it("handles an idea that is entirely special characters", () => {
    const slug = buildSlug("!!!! ???? #### $$$$");
    expect(typeof slug).toBe("string");
    expect(slug.length).toBeLessThanOrEqual(40);
  });

  it("caps the slug at 40 characters", () => {
    const slug = buildSlug("superlongwordone superlongwordtwo superlongwordthree superlongwordfour");
    expect(slug.length).toBeLessThanOrEqual(40);
  });

  it("handles a single word idea", () => {
    const slug = buildSlug("Slack");
    expect(slug).toBe("slack");
  });

  it("handles numeric idea summaries", () => {
    const slug = buildSlug("123 456 789");
    expect(slug).toBe("123-456-789");
  });

  it("collapses multiple consecutive spaces", () => {
    // split(/\s+/) treats multiple spaces as one separator
    const slug = buildSlug("word1   word2   word3");
    expect(slug).toBe("word1-word2-word3");
  });
});

// ─── generateDiscoveryMarkdown edge cases ────────────────────────────────────

describe("generateDiscoveryMarkdown — edge cases", () => {
  it("handles empty ideaSummary without throwing", () => {
    const session: ValidationSession = { ...baseSession, ideaSummary: "" };
    expect(() => generateDiscoveryMarkdown(session)).not.toThrow();
  });

  it("handles empty messages array", () => {
    const session: ValidationSession = { ...baseSession, ideaSummary: "Test idea", messages: [] };
    const md = generateDiscoveryMarkdown(session);
    expect(md).toContain("## Conversation");
  });

  it("handles a session with all scores at their maximum (10)", () => {
    const session: ValidationSession = {
      ...baseSession,
      ideaSummary: "Perfect idea",
      scores: { desirability: 10, viability: 10, feasibility: 10 },
    };
    const md = generateDiscoveryMarkdown(session);
    expect(md).toContain("10/10");
  });

  it("includes all kill signal types when multiple are present", () => {
    const session: ValidationSession = {
      ...baseSession,
      ideaSummary: "Risky idea",
      killSignals: [
        { type: "tarpit", evidence: "Many failed startups in this space", detectedAt: 3 },
        { type: "saturation", evidence: "10+ active competitors with no gap", detectedAt: 5 },
        { type: "no_willingness_to_pay", evidence: "All competitors are free", detectedAt: 7 },
      ],
    };
    const md = generateDiscoveryMarkdown(session);
    expect(md).toContain("tarpit");
    expect(md).toContain("saturation");
    expect(md).toContain("no_willingness_to_pay");
  });

  it("does not include isStreaming in generated markdown (transient field)", () => {
    const session: ValidationSession = {
      ...baseSession,
      ideaSummary: "Test idea",
      messages: [
        {
          id: "m1",
          role: "assistant",
          content: "What does your idea do?",
          timestamp: 1740000000000,
          isStreaming: true, // This must never appear in the markdown output
        },
      ],
    };
    const md = generateDiscoveryMarkdown(session);
    expect(md).not.toContain("isStreaming");
  });

  it("handles a very long ideaSummary without truncation", () => {
    const longSummary = "a".repeat(500);
    const session: ValidationSession = { ...baseSession, ideaSummary: longSummary };
    const md = generateDiscoveryMarkdown(session);
    expect(md).toContain(longSummary);
  });
});
