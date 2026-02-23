import { describe, it, expect } from "vitest";
import { generateDiscoveryMarkdown } from "@/lib/markdown";
import type { ValidationSession } from "@/types";

const mockSession: ValidationSession = {
  id: "test-session-001",
  ideaSummary: "A habit tracker for remote teams",
  phase: "complete",
  messages: [
    {
      id: "msg-001",
      role: "user",
      content: "I want to build a habit tracker for remote teams",
      timestamp: 1740000000000,
    },
    {
      id: "msg-002",
      role: "assistant",
      content: "Interesting — who specifically on the team would use this?",
      timestamp: 1740000005000,
    },
  ],
  scores: {
    desirability: 7,
    viability: 5,
    feasibility: 8,
  },
  killSignals: [],
  researchComplete: true,
  createdAt: 1740000000000,
  updatedAt: 1740000100000,
};

describe("markdown.ts — generateDiscoveryMarkdown", () => {
  it("includes the idea summary in the title", () => {
    const md = generateDiscoveryMarkdown(mockSession);
    expect(md).toContain("A habit tracker for remote teams");
  });

  it("includes confidence scores", () => {
    const md = generateDiscoveryMarkdown(mockSession);
    expect(md).toContain("7/10");
    expect(md).toContain("5/10");
    expect(md).toContain("8/10");
  });

  it("includes conversation history", () => {
    const md = generateDiscoveryMarkdown(mockSession);
    expect(md).toContain("I want to build a habit tracker");
    expect(md).toContain("Interesting — who specifically");
  });

  it("labels user messages as You", () => {
    const md = generateDiscoveryMarkdown(mockSession);
    expect(md).toContain("**You:**");
  });

  it("labels assistant messages as ProveIt", () => {
    const md = generateDiscoveryMarkdown(mockSession);
    expect(md).toContain("**ProveIt:**");
  });

  it("includes kill signals when present", () => {
    const sessionWithKillSignal: ValidationSession = {
      ...mockSession,
      killSignals: [
        {
          type: "tarpit",
          evidence: "Seven startups have tried this exact approach since 2018",
          detectedAt: 5,
        },
      ],
    };
    const md = generateDiscoveryMarkdown(sessionWithKillSignal);
    expect(md).toContain("Kill Signals");
    expect(md).toContain("Tarpit");
    expect(md).toContain("Seven startups");
  });

  it("does not include kill signals section when none detected", () => {
    const md = generateDiscoveryMarkdown(mockSession);
    // Kill signals section only appears when killSignals.length > 0
    expect(md).not.toContain("Kill Signals");
  });

  it("handles null scores gracefully", () => {
    const sessionNullScores: ValidationSession = {
      ...mockSession,
      scores: { desirability: null, viability: null, feasibility: null },
    };
    const md = generateDiscoveryMarkdown(sessionNullScores);
    expect(md).toContain("—");
  });

  it("generates valid markdown structure", () => {
    const md = generateDiscoveryMarkdown(mockSession);
    expect(md).toMatch(/^# ProveIt Validation Report/);
    expect(md).toContain("## Confidence Scores");
    expect(md).toContain("## Discovery & Research");
  });
});
