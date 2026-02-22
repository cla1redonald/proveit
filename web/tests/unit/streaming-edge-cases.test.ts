/**
 * Edge case tests for lib/streaming.ts — readStream.
 *
 * The existing streaming.test.ts covers the happy paths.
 * This file targets:
 *   - Events split across chunk boundaries
 *   - Multiple events packed into one chunk
 *   - Chunk ending mid-event-line (no newline yet)
 *   - Stream that emits no data at all
 *   - Empty lines (should be silently skipped)
 *   - kill_signal event parsing
 */
import { describe, it, expect, vi } from "vitest";
import { readStream } from "@/lib/streaming";
import type { StreamEvent } from "@/types";

function makeStream(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain" },
  });
}

describe("readStream — edge cases", () => {
  it("handles an event line split across two chunks", async () => {
    const events: StreamEvent[] = [];
    // The data: line is delivered in two separate chunks
    const response = makeStream([
      'data: {"type":"do',
      'ne"}\n',
    ]);
    await readStream(response, vi.fn(), (e) => events.push(e));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("done");
  });

  it("handles multiple events packed into one chunk", async () => {
    const events: StreamEvent[] = [];
    const response = makeStream([
      'data: {"type":"searching","active":true}\ndata: {"type":"searching","active":false}\ndata: {"type":"done"}\n',
    ]);
    await readStream(response, vi.fn(), (e) => events.push(e));
    expect(events).toHaveLength(3);
    expect(events[0].type).toBe("searching");
    expect(events[1].type).toBe("searching");
    expect(events[2].type).toBe("done");
  });

  it("handles a stream that emits no data (empty response body)", async () => {
    const texts: string[] = [];
    const events: StreamEvent[] = [];
    const response = makeStream([]);
    await expect(
      readStream(response, (c) => texts.push(c), (e) => events.push(e))
    ).resolves.not.toThrow();
    expect(texts).toHaveLength(0);
    expect(events).toHaveLength(0);
  });

  it("silently skips empty lines (blank separators between events)", async () => {
    const texts: string[] = [];
    const response = makeStream(["\n\n\n"]);
    await readStream(response, (c) => texts.push(c), vi.fn());
    // Empty lines produce no text calls
    expect(texts).toHaveLength(0);
  });

  it("handles text interleaved with events across multiple chunks", async () => {
    const texts: string[] = [];
    const events: StreamEvent[] = [];
    const response = makeStream([
      "I found some results.\n",
      'data: {"type":"scores","scores":{"desirability":8,"viability":6,"feasibility":null}}\n',
      "Here is the summary.\n",
      'data: {"type":"done"}\n',
    ]);
    await readStream(response, (c) => texts.push(c), (e) => events.push(e));

    const fullText = texts.join("");
    expect(fullText).toContain("I found some results.");
    expect(fullText).toContain("Here is the summary.");
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("scores");
    expect(events[1].type).toBe("done");
  });

  it("parses kill_signal event", async () => {
    const events: StreamEvent[] = [];
    const response = makeStream([
      'data: {"type":"kill_signal","signal":{"type":"tarpit","evidence":"7 startups tried this","detectedAt":5}}\n',
    ]);
    await readStream(response, vi.fn(), (e) => events.push(e));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("kill_signal");
    if (events[0].type === "kill_signal") {
      expect(events[0].signal.type).toBe("tarpit");
      expect(events[0].signal.evidence).toBe("7 startups tried this");
    }
  });

  it("handles chunk that contains only part of a text line (no newline)", async () => {
    // The chunk has no newline — should be buffered and flushed at end
    const texts: string[] = [];
    const response = makeStream(["partial line without newline"]);
    await readStream(response, (c) => texts.push(c), vi.fn());
    expect(texts.join("")).toBe("partial line without newline");
  });

  it("handles scores event with all null fields", async () => {
    const events: StreamEvent[] = [];
    const response = makeStream([
      'data: {"type":"scores","scores":{"desirability":null,"viability":null,"feasibility":null}}\n',
    ]);
    await readStream(response, vi.fn(), (e) => events.push(e));
    expect(events[0].type).toBe("scores");
    if (events[0].type === "scores") {
      expect(events[0].scores.desirability).toBeNull();
      expect(events[0].scores.viability).toBeNull();
      expect(events[0].scores.feasibility).toBeNull();
    }
  });

  it("continues processing after a malformed event line", async () => {
    const events: StreamEvent[] = [];
    const texts: string[] = [];
    const response = makeStream([
      "data: {broken json\n",
      "some text\n",
      'data: {"type":"done"}\n',
    ]);
    await readStream(response, (c) => texts.push(c), (e) => events.push(e));
    // Malformed line ignored; text line and done event are still processed
    expect(texts.join("")).toContain("some text");
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("done");
  });
});
