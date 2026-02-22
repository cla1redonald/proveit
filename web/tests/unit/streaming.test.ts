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

describe("streaming.ts — readStream", () => {
  it("calls onText for regular text chunks", async () => {
    const texts: string[] = [];
    const response = makeStream(["Hello, ", "world!\n"]);
    await readStream(response, (chunk) => texts.push(chunk), vi.fn());
    const combined = texts.join("");
    expect(combined).toContain("Hello,");
    expect(combined).toContain("world!");
  });

  it("calls onEvent for data: event lines", async () => {
    const events: StreamEvent[] = [];
    const response = makeStream([
      'data: {"type":"done"}\n',
    ]);
    await readStream(response, vi.fn(), (e) => events.push(e));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("done");
  });

  it("parses searching event correctly", async () => {
    const events: StreamEvent[] = [];
    const response = makeStream([
      'data: {"type":"searching","active":true}\n',
    ]);
    await readStream(response, vi.fn(), (e) => events.push(e));
    expect(events[0].type).toBe("searching");
    if (events[0].type === "searching") {
      expect(events[0].active).toBe(true);
    }
  });

  it("parses phase_change event", async () => {
    const events: StreamEvent[] = [];
    const response = makeStream([
      'data: {"type":"phase_change","phase":"research"}\n',
    ]);
    await readStream(response, vi.fn(), (e) => events.push(e));
    expect(events[0].type).toBe("phase_change");
    if (events[0].type === "phase_change") {
      expect(events[0].phase).toBe("research");
    }
  });

  it("handles mixed text and event lines", async () => {
    const texts: string[] = [];
    const events: StreamEvent[] = [];
    const response = makeStream([
      "Some text\n",
      'data: {"type":"done"}\n',
      "More text\n",
    ]);
    await readStream(response, (c) => texts.push(c), (e) => events.push(e));
    expect(texts.join("")).toContain("Some text");
    expect(texts.join("")).toContain("More text");
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("done");
  });

  it("ignores malformed event lines without throwing", async () => {
    const events: StreamEvent[] = [];
    const response = makeStream(["data: {not valid json}\n"]);
    await expect(
      readStream(response, vi.fn(), (e) => events.push(e))
    ).resolves.not.toThrow();
    expect(events).toHaveLength(0);
  });

  it("flushes remaining buffer after stream ends", async () => {
    const texts: string[] = [];
    // Chunk that doesn't end in newline — should be flushed
    const response = makeStream(["no newline at end"]);
    await readStream(response, (c) => texts.push(c), vi.fn());
    expect(texts.join("")).toBe("no newline at end");
  });

  it("handles score events", async () => {
    const events: StreamEvent[] = [];
    const response = makeStream([
      'data: {"type":"scores","scores":{"desirability":7,"viability":5,"feasibility":null}}\n',
    ]);
    await readStream(response, vi.fn(), (e) => events.push(e));
    expect(events[0].type).toBe("scores");
    if (events[0].type === "scores") {
      expect(events[0].scores.desirability).toBe(7);
      expect(events[0].scores.viability).toBe(5);
      expect(events[0].scores.feasibility).toBeNull();
    }
  });
});
