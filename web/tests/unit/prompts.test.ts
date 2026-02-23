import { describe, it, expect, vi } from "vitest";

// Mock server-only to allow importing in tests
vi.mock("server-only", () => ({}));

import { buildFastCheckPrompt, buildChatSystemPrompt } from "@/lib/prompts";

describe("prompts.ts — buildFastCheckPrompt", () => {
  it("returns a non-empty string", () => {
    const prompt = buildFastCheckPrompt();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(100);
  });

  it("includes key instruction about 3 assumptions", () => {
    const prompt = buildFastCheckPrompt();
    expect(prompt).toContain("3 critical assumptions");
  });

  it("includes SUPPORTED/WEAK/CONTRADICTED verdicts", () => {
    const prompt = buildFastCheckPrompt();
    expect(prompt).toContain("SUPPORTED");
    expect(prompt).toContain("WEAK");
    expect(prompt).toContain("CONTRADICTED");
  });

  it("instructs model not to make go/kill decisions", () => {
    const prompt = buildFastCheckPrompt();
    expect(prompt).toContain("go/kill decision");
  });

  it("includes formatting instructions", () => {
    const prompt = buildFastCheckPrompt();
    expect(prompt).toContain("Assumption 1:");
    expect(prompt).toContain("Assumption 2:");
    expect(prompt).toContain("Assumption 3:");
  });
});

describe("prompts.ts — buildChatSystemPrompt", () => {
  it("injects the phase into the prompt", () => {
    const prompt = buildChatSystemPrompt("discovery", {
      desirability: null,
      viability: null,
      feasibility: null,
    });
    expect(prompt).toContain("discovery");
  });

  it("injects numerical scores when provided", () => {
    const prompt = buildChatSystemPrompt("findings", {
      desirability: 7,
      viability: 5,
      feasibility: null,
    });
    expect(prompt).toContain("7/10");
    expect(prompt).toContain("5/10");
  });

  it("shows not yet scored when scores are null", () => {
    const prompt = buildChatSystemPrompt("brain_dump", {
      desirability: null,
      viability: null,
      feasibility: null,
    });
    expect(prompt).toContain("not yet scored");
  });

  it("includes kill signal detection instructions", () => {
    const prompt = buildChatSystemPrompt("research", {
      desirability: null,
      viability: null,
      feasibility: null,
    });
    expect(prompt).toContain("Kill signals");
  });

  it("includes one-question-at-a-time rule", () => {
    const prompt = buildChatSystemPrompt("brain_dump", {
      desirability: null,
      viability: null,
      feasibility: null,
    });
    expect(prompt).toContain("one question at a time");
  });

  it("includes web_search instruction in research phase context", () => {
    const prompt = buildChatSystemPrompt("research", {
      desirability: null,
      viability: null,
      feasibility: null,
    });
    expect(prompt).toContain("web_search");
  });

  // ─── Conditional research gate (added in discovery phase) ──────────────────
  // The discovery phase now has a branch: when context is sufficient, evaluate
  // whether to run research or skip straight to findings. These tests verify
  // that both the "go to research" path and the "skip research" path are
  // described in the prompt so the model has the instruction it needs.

  it("discovery phase prompt tells model to emit research phase_change when signals are present", () => {
    const prompt = buildChatSystemPrompt("discovery", {
      desirability: null,
      viability: null,
      feasibility: null,
    });
    // The prompt must contain the phrase that triggers the research transition
    expect(prompt).toContain('phase_change","phase":"research"');
  });

  it("discovery phase prompt tells model to skip research and go to findings when evidence is clearly negative", () => {
    const prompt = buildChatSystemPrompt("discovery", {
      desirability: null,
      viability: null,
      feasibility: null,
    });
    // The prompt must describe the skip-to-findings path
    expect(prompt).toContain('phase_change","phase":"findings"');
  });

  it("discovery phase prompt includes the low-score threshold that triggers the research skip (1–2)", () => {
    const prompt = buildChatSystemPrompt("discovery", {
      desirability: null,
      viability: null,
      feasibility: null,
    });
    // The scoring criterion that gates the skip is explicit: scores of 1-2
    expect(prompt).toContain("1–2");
  });

  it("discovery phase prompt defaults to running research when in doubt", () => {
    const prompt = buildChatSystemPrompt("discovery", {
      desirability: null,
      viability: null,
      feasibility: null,
    });
    // The fallback rule must be present
    expect(prompt).toContain("When in doubt, run research");
  });
});
