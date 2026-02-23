/**
 * Unit tests for cleanAssistantText in lib/markdown.ts.
 *
 * The function is exported and used in both generateDiscoveryMarkdown and
 * StreamingText.tsx. The existing markdown.test.ts verifies generateDiscoveryMarkdown
 * end-to-end but never calls cleanAssistantText directly, so the stripping
 * logic has no isolated coverage.
 */
import { describe, it, expect } from "vitest";
import { cleanAssistantText } from "@/lib/markdown";

describe("cleanAssistantText", () => {
  // ─── tool_call stripping ──────────────────────────────────────────────────────

  it("strips a single <tool_call> block", () => {
    // The tag occupies its own line: stripping it leaves the surrounding \n\n
    // which the excess-newline collapser leaves as \n\n (only 3+ are collapsed)
    const input = 'Hello\n<tool_call>{"name":"web_search","input":{}}</tool_call>\nWorld';
    expect(cleanAssistantText(input)).toBe("Hello\n\nWorld");
  });

  it("strips a multi-line <tool_call> block", () => {
    // The block occupies multiple lines: after removal the two surrounding newlines
    // remain as \n\n
    const input = "Before\n<tool_call>\n  some\n  content\n</tool_call>\nAfter";
    expect(cleanAssistantText(input)).toBe("Before\n\nAfter");
  });

  it("strips multiple <tool_call> blocks in one pass", () => {
    const input =
      'text1\n<tool_call>A</tool_call>\ntext2\n<tool_call>B</tool_call>\ntext3';
    const result = cleanAssistantText(input);
    expect(result).not.toContain("<tool_call>");
    expect(result).toContain("text1");
    expect(result).toContain("text2");
    expect(result).toContain("text3");
  });

  // ─── tool_response stripping ──────────────────────────────────────────────────

  it("strips a single <tool_response> block", () => {
    // Same behaviour as tool_call: surrounding newlines become \n\n
    const input =
      'Search done.\n<tool_response>{"results":[]}</tool_response>\nHere are my findings.';
    expect(cleanAssistantText(input)).toBe("Search done.\n\nHere are my findings.");
  });

  it("strips a multi-line <tool_response> block", () => {
    const input = "Pre\n<tool_response>\nline1\nline2\n</tool_response>\nPost";
    expect(cleanAssistantText(input)).toBe("Pre\n\nPost");
  });

  it("strips both tool_call and tool_response when both are present", () => {
    const input =
      "A\n<tool_call>call</tool_call>\nB\n<tool_response>resp</tool_response>\nC";
    const result = cleanAssistantText(input);
    expect(result).not.toContain("<tool_call>");
    expect(result).not.toContain("<tool_response>");
    expect(result).toContain("A");
    expect(result).toContain("B");
    expect(result).toContain("C");
  });

  // ─── Excess blank-line collapsing ─────────────────────────────────────────────

  it("collapses three or more consecutive newlines to two", () => {
    const input = "Para 1\n\n\n\nPara 2";
    expect(cleanAssistantText(input)).toBe("Para 1\n\nPara 2");
  });

  it("leaves exactly two consecutive newlines unchanged", () => {
    const input = "Para 1\n\nPara 2";
    expect(cleanAssistantText(input)).toBe("Para 1\n\nPara 2");
  });

  it("leaves a single newline unchanged", () => {
    const input = "Line 1\nLine 2";
    expect(cleanAssistantText(input)).toBe("Line 1\nLine 2");
  });

  // ─── Trim ─────────────────────────────────────────────────────────────────────

  it("trims leading and trailing whitespace", () => {
    const input = "  \n\nHello World\n\n  ";
    expect(cleanAssistantText(input)).toBe("Hello World");
  });

  // ─── Pass-through cases ───────────────────────────────────────────────────────

  it("returns empty string when input is empty", () => {
    expect(cleanAssistantText("")).toBe("");
  });

  it("returns plain text unchanged (no markup, no excess newlines)", () => {
    const input = "What does your idea do?";
    expect(cleanAssistantText(input)).toBe(input);
  });

  it("does not strip other XML-like tags that are legitimate markdown content", () => {
    // e.g. a user might include angle-bracket notation in their message;
    // cleanAssistantText should only target the two known tags
    const input = "See <strong>this</strong> for details";
    expect(cleanAssistantText(input)).toContain("<strong>");
  });

  // ─── Edge: markup adjacent to real content with no surrounding whitespace ─────

  it("strips inline tool_call with no surrounding newlines", () => {
    const input = "Leading<tool_call>x</tool_call>Trailing";
    const result = cleanAssistantText(input);
    expect(result).not.toContain("<tool_call>");
    // After stripping the tags the remaining text is "LeadingTrailing" (trimmed)
    expect(result).toBe("LeadingTrailing");
  });

  // ─── What generateDiscoveryMarkdown relies on ─────────────────────────────────

  it("returns empty string for a message that is purely tool markup", () => {
    const input = "<tool_call>search</tool_call><tool_response>results</tool_response>";
    // After stripping, only whitespace remains — trim produces ""
    expect(cleanAssistantText(input)).toBe("");
  });
});
