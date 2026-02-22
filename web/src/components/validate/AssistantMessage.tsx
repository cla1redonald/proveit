"use client";

import type { Message } from "@/types";
import StreamingText from "./StreamingText";

interface AssistantMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export default function AssistantMessage({
  message,
  isStreaming = false,
}: AssistantMessageProps) {
  return (
    <div className="flex justify-start">
      <div
        className="font-mono prose prose-invert max-w-none"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius:
            "var(--radius-lg) var(--radius-lg) var(--radius-lg) 0",
          maxWidth: "84%",
          padding: "var(--space-4) var(--space-5)",
          fontSize: "var(--text-base)",
          lineHeight: "var(--leading-relaxed)",
          color: "var(--text-primary)",
          wordBreak: "break-word",
        }}
        aria-busy={isStreaming}
        aria-label={isStreaming ? "ProveIt is typing" : "ProveIt message complete"}
      >
        <StreamingText text={message.content} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
