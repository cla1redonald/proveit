"use client";

import { useState, useRef, useEffect } from "react";
import type { DiscoveryPhase } from "@/types";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  isDisabled: boolean;
  phase?: DiscoveryPhase;
}

export default function ChatInput({
  onSend,
  onStop,
  isStreaming,
  isDisabled,
  phase,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isResearch = phase === "research";

  const placeholder = isResearch
    ? "Research in progress..."
    : "Type your answer...";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && !isDisabled && !isResearch && value.trim().length > 0) {
        onSend(value.trim());
        setValue("");
      }
    }
  };

  const handleSend = () => {
    if (!isStreaming && !isDisabled && !isResearch && value.trim().length > 0) {
      onSend(value.trim());
      setValue("");
    }
  };

  // Focus after streaming completes
  useEffect(() => {
    if (!isStreaming && !isDisabled && !isResearch) {
      textareaRef.current?.focus();
    }
  }, [isStreaming, isDisabled, isResearch]);

  const inputDisabled = isStreaming || isDisabled || isResearch;

  return (
    <div
      className="border-t px-[var(--space-4)] py-[var(--space-3)] flex gap-[var(--space-3)] items-end"
      style={{
        backgroundColor: "var(--bg-base)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="flex-1">
        <label htmlFor="chat-input" className="sr-only">
          Type your answer
        </label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={inputDisabled}
          placeholder={placeholder}
          rows={1}
          className="w-full rounded-[var(--radius-md)] border font-mono resize-none overflow-hidden"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
            color: inputDisabled ? "var(--text-muted)" : "var(--text-primary)",
            fontSize: "var(--text-base)",
            lineHeight: "var(--leading-normal)",
            padding: "var(--space-3) var(--space-4)",
            minHeight: "44px",
            maxHeight: "200px",
            opacity: inputDisabled ? 0.6 : 1,
            cursor: inputDisabled ? "not-allowed" : "text",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
          }}
        />
      </div>

      {isStreaming ? (
        <button
          onClick={onStop}
          className="outline-btn inline-flex items-center justify-center px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-medium uppercase tracking-[0.08em] border shrink-0"
          aria-label="Stop response"
        >
          STOP
        </button>
      ) : (
        !isResearch && (
          <button
            onClick={handleSend}
            disabled={inputDisabled || value.trim().length === 0}
            className="accent-btn inline-flex items-center justify-center px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-semibold uppercase tracking-[0.08em] shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            SEND
          </button>
        )
      )}
    </div>
  );
}
