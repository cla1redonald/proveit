/**
 * Unit tests for lib/deck/template.ts
 *
 * Verifies:
 *   - renderDeckHtml produces a complete HTML document
 *   - Score values appear in the output, including null/n/a handling
 *   - Kill signal labels and evidence appear
 *   - Findings and recommendations appear
 *   - Asset paths use /deck-assets/ prefix
 *   - Cover uses the idea summary
 *   - No em-dashes in generated HTML (SKILL.md rule)
 */
import { describe, it, expect } from "vitest";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

import { renderDeckHtml, type DeckData } from "@/lib/deck/template";
import type { ConfidenceScores, KillSignal } from "@/types/index";

const BASE_SCORES: ConfidenceScores = {
  desirability: 72,
  viability: 54,
  feasibility: 81,
};

const BASE_KILL_SIGNALS: KillSignal[] = [
  {
    type: "no_willingness_to_pay",
    evidence: "Users said they would not pay for this.",
    detectedAt: 5,
  },
];

const BASE_DATA: DeckData = {
  ideaSummary: "An AI tool for product managers to validate ideas quickly.",
  scores: BASE_SCORES,
  killSignals: BASE_KILL_SIGNALS,
  findings: [
    { title: "Strong desirability signal", body: "Interviewees consistently cited this pain.", source: "6 interviews" },
    { title: "Competitive pressure high", body: "Three direct competitors launched in Q1 2026." },
  ],
  recommendations: [
    { title: "Run a pricing experiment", body: "Test a freemium-to-paid conversion at the PRD gate." },
  ],
  soWhat: "The pain is real but the pricing model needs validation.",
};

describe("renderDeckHtml", () => {
  it("returns a string starting with <!DOCTYPE html>", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html.trimStart().startsWith("<!DOCTYPE html>")).toBe(true);
  });

  it("includes the idea summary in the cover slide", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html).toContain("An AI tool for product managers to validate ideas quickly.");
  });

  it("includes all three score values", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html).toContain("72%");
    expect(html).toContain("54%");
    expect(html).toContain("81%");
  });

  it("handles null scores by rendering n/a", () => {
    const data: DeckData = {
      ...BASE_DATA,
      scores: { desirability: null, viability: null, feasibility: null },
    };
    const html = renderDeckHtml(data);
    // Should have at least one n/a value
    expect(html).toContain("n/a");
  });

  it("handles mixed null and number scores", () => {
    const data: DeckData = {
      ...BASE_DATA,
      scores: { desirability: 65, viability: null, feasibility: 80 },
    };
    const html = renderDeckHtml(data);
    expect(html).toContain("65%");
    expect(html).toContain("n/a");
    expect(html).toContain("80%");
  });

  it("includes kill signal type label", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html).toContain("No willingness to pay");
  });

  it("includes kill signal evidence text", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html).toContain("Users said they would not pay for this.");
  });

  it("includes all kill signal types when multiple are present", () => {
    const data: DeckData = {
      ...BASE_DATA,
      killSignals: [
        { type: "tarpit", evidence: "Classic tarpit pattern detected.", detectedAt: 2 },
        { type: "saturation", evidence: "Market is fully saturated.", detectedAt: 7 },
        { type: "no_switching", evidence: "No switching trigger found.", detectedAt: 12 },
      ],
    };
    const html = renderDeckHtml(data);
    expect(html).toContain("Tarpit idea");
    expect(html).toContain("Market saturated");
    expect(html).toContain("No switching trigger");
    expect(html).toContain("Classic tarpit pattern detected.");
    expect(html).toContain("Market is fully saturated.");
    expect(html).toContain("No switching trigger found.");
  });

  it("shows 'no kill signals' message when killSignals is empty", () => {
    const data: DeckData = { ...BASE_DATA, killSignals: [] };
    const html = renderDeckHtml(data);
    expect(html).toContain("No critical kill signals detected");
  });

  it("includes finding titles and bodies", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html).toContain("Strong desirability signal");
    expect(html).toContain("Interviewees consistently cited this pain.");
    expect(html).toContain("Competitive pressure high");
    expect(html).toContain("Three direct competitors launched in Q1 2026.");
  });

  it("includes finding source when provided", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html).toContain("6 interviews");
  });

  it("includes recommendation title and body", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html).toContain("Run a pricing experiment");
    expect(html).toContain("Test a freemium-to-paid conversion at the PRD gate.");
  });

  it("includes the soWhat text", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html).toContain("The pain is real but the pricing model needs validation.");
  });

  it("uses /deck-assets/ for CSS links", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html).toContain("/deck-assets/colors_and_type.css");
    expect(html).toContain("/deck-assets/deck.css");
    expect(html).toContain("/deck-assets/deck-stage.js");
  });

  it("references the deck-stage web component", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html).toContain("<deck-stage");
    expect(html).toContain("width=\"1280\"");
    expect(html).toContain("height=\"720\"");
  });

  it("contains no em-dashes in the rendered output", () => {
    const html = renderDeckHtml(BASE_DATA);
    // Em-dash Unicode and HTML entity
    expect(html).not.toContain("—");
    expect(html).not.toContain("&mdash;");
    expect(html).not.toContain("&#8212;");
  });

  it("HTML-escapes special characters in ideaSummary", () => {
    const data: DeckData = {
      ...BASE_DATA,
      ideaSummary: 'An idea with <script>alert("xss")</script> in it',
    };
    const html = renderDeckHtml(data);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("HTML-escapes special characters in kill signal evidence", () => {
    const data: DeckData = {
      ...BASE_DATA,
      killSignals: [
        { type: "tarpit", evidence: "Evidence with <b>bold</b> & ampersand", detectedAt: 1 },
      ],
    };
    const html = renderDeckHtml(data);
    expect(html).not.toContain("<b>bold</b>");
    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt;");
    expect(html).toContain("&amp;");
  });

  it("renders deterministically — same input, same output", () => {
    const html1 = renderDeckHtml(BASE_DATA);
    const html2 = renderDeckHtml(BASE_DATA);
    expect(html1).toBe(html2);
  });

  it("includes ProveIt close slide", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html).toContain("Good ideas survive scrutiny");
    expect(html).toContain("proveit.tools");
  });

  it("includes en-GB lang attribute", () => {
    const html = renderDeckHtml(BASE_DATA);
    expect(html).toContain('lang="en-GB"');
  });
});
