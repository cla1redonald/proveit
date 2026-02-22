// Client-side utility

import type { StreamEvent } from "@/types";

/**
 * Reads a streaming response body, dispatching text chunks and parsed event lines.
 * Text chunks: raw UTF-8 text (non-event lines)
 * Event lines: lines starting with "data: " parsed as StreamEvent JSON
 */
export async function readStream(
  response: Response,
  onText: (chunk: string) => void,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Split on newlines to find event lines
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // keep incomplete last line in buffer

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6)) as StreamEvent;
          onEvent(event);
        } catch {
          // Malformed event line — ignore and continue
        }
      } else if (line.length > 0) {
        onText(line + "\n");
      }
    }
  }

  // Flush remaining buffer
  if (buffer.length > 0) {
    onText(buffer);
  }
}
