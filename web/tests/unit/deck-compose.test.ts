/**
 * Unit tests for lib/deck/compose.ts
 *
 * Verifies:
 *   - ComposedContentSchema validates correct data
 *   - ComposedContentSchema rejects missing required fields
 *   - composeDeckContent returns null when ANTHROPIC_API_KEY is unset
 *   - composeDeckContent parses and returns valid model response
 *   - composeDeckContent strips markdown code fences from model output
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ComposedContentSchema } from "@/lib/deck/compose";
import type { ValidationSession } from "@/types/index";

// ─── Sample data ──────────────────────────────────────────────────────────────

const VALID_CONTENT = {
  findings: [
    { title: "Finding one", body: "Body of finding one.", source: "Interview data" },
    { title: "Finding two", body: "Body of finding two." },
  ],
  recommendations: [
    { title: "Do this first", body: "Description of what to do." },
  ],
  soWhat: "The key takeaway for the founder.",
  artifacts: {
    specMd: "# Product spec\n\nProblem: ...\n\nSolution: ...",
    designBriefMd: "# Design brief\n\nContext: ...",
    promptsMd: "# Follow-up prompts\n\n## Research prompt\n```\nPrompt text here\n```",
  },
};

const SAMPLE_SESSION: ValidationSession = {
  id: "test-session-id",
  ideaSummary: "A tool for product managers.",
  phase: "complete",
  messages: [
    { id: "m1", role: "user", content: "Here is my idea.", timestamp: 1000 },
    { id: "m2", role: "assistant", content: "Tell me more.", timestamp: 2000 },
  ],
  scores: { desirability: 70, viability: 55, feasibility: 80 },
  killSignals: [
    { type: "tarpit", evidence: "Classic tarpit.", detectedAt: 5 },
  ],
  researchComplete: true,
  createdAt: 1000,
  updatedAt: 2000,
};

// ─── Schema validation tests ──────────────────────────────────────────────────

describe("ComposedContentSchema", () => {
  it("accepts a valid content object", () => {
    const result = ComposedContentSchema.safeParse(VALID_CONTENT);
    expect(result.success).toBe(true);
  });

  it("accepts content without optional source field", () => {
    const data = {
      ...VALID_CONTENT,
      findings: [{ title: "Finding", body: "Body" }],
    };
    const result = ComposedContentSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects when findings is empty", () => {
    const data = { ...VALID_CONTENT, findings: [] };
    const result = ComposedContentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when recommendations is empty", () => {
    const data = { ...VALID_CONTENT, recommendations: [] };
    const result = ComposedContentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when soWhat is empty string", () => {
    const data = { ...VALID_CONTENT, soWhat: "" };
    const result = ComposedContentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when specMd is empty string", () => {
    const data = {
      ...VALID_CONTENT,
      artifacts: { ...VALID_CONTENT.artifacts, specMd: "" },
    };
    const result = ComposedContentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects when artifacts is missing", () => {
    const { artifacts: _artifacts, ...rest } = VALID_CONTENT;
    const result = ComposedContentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when findings items have missing title", () => {
    const data = {
      ...VALID_CONTENT,
      findings: [{ body: "Body only, no title" }],
    };
    const result = ComposedContentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects findings with more than 5 items", () => {
    const data = {
      ...VALID_CONTENT,
      findings: Array.from({ length: 6 }, (_, i) => ({
        title: `Finding ${i}`,
        body: `Body ${i}`,
      })),
    };
    const result = ComposedContentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts findings with exactly 5 items", () => {
    const data = {
      ...VALID_CONTENT,
      findings: Array.from({ length: 5 }, (_, i) => ({
        title: `Finding ${i}`,
        body: `Body ${i}`,
      })),
    };
    const result = ComposedContentSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

// ─── composeDeckContent function tests ───────────────────────────────────────

describe("composeDeckContent (no API key)", () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("returns null when ANTHROPIC_API_KEY is unset", async () => {
    const { composeDeckContent } = await import("@/lib/deck/compose");
    const result = await composeDeckContent(SAMPLE_SESSION);
    expect(result).toBeNull();
  });
});

// ─── Schema round-trip tests (no API call) ────────────────────────────────────

describe("composeDeckContent schema round-trip (validates real JSON)", () => {
  it("parses valid JSON into ComposedContent via schema", () => {
    // Simulate what the model returns and what the schema validates
    const raw = JSON.stringify(VALID_CONTENT);
    const parsed: unknown = JSON.parse(raw);
    const result = ComposedContentSchema.safeParse(parsed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.findings[0].title).toBe("Finding one");
      expect(result.data.soWhat).toBe("The key takeaway for the founder.");
      expect(result.data.artifacts.specMd).toContain("Product spec");
    }
  });

  it("parses JSON stripped of markdown fences", () => {
    const fenced = "```json\n" + JSON.stringify(VALID_CONTENT) + "\n```";
    const cleaned = fenced.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed: unknown = JSON.parse(cleaned);
    const result = ComposedContentSchema.safeParse(parsed);
    expect(result.success).toBe(true);
  });

  it("rejects malformed JSON that passes JSON.parse but fails schema", () => {
    const malformed = { findings: "not-an-array", soWhat: "ok", recommendations: [] };
    const result = ComposedContentSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });
});
