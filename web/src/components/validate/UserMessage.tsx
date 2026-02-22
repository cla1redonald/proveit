"use client";

import type { Message } from "@/types";

interface UserMessageProps {
  message: Message;
}

export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div
        className="font-mono"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius:
            "var(--radius-lg) var(--radius-lg) 0 var(--radius-lg)",
          maxWidth: "80%",
          padding: "var(--space-3) var(--space-4)",
          fontSize: "var(--text-base)",
          lineHeight: "var(--leading-normal)",
          color: "var(--text-primary)",
          wordBreak: "break-word",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}
