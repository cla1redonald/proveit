"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/types";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

interface MessageListProps {
  messages: Message[];
  streamingMessage: string | null;
  beforeStreaming?: React.ReactNode;
}

export default function MessageList({
  messages,
  streamingMessage,
  beforeStreaming,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  return (
    <div className="space-y-[var(--space-3)]">
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === "user" ? (
            <UserMessage message={message} />
          ) : (
            <AssistantMessage message={message} isStreaming={false} />
          )}
        </div>
      ))}

      {/* Slot rendered between committed messages and the streaming message */}
      {beforeStreaming}

      {/* Streaming message — shown below committed messages */}
      {streamingMessage !== null && (
        <AssistantMessage
          message={{
            id: "streaming",
            role: "assistant",
            content: streamingMessage,
            timestamp: Date.now(),
          }}
          isStreaming={true}
        />
      )}

      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
