"use client";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
}

export default function StreamingText({ text, isStreaming }: StreamingTextProps) {
  return (
    <span>
      {text}
      {isStreaming && (
        <span
          className="streaming-cursor"
          aria-hidden="true"
          aria-label="ProveIt is typing"
        />
      )}
    </span>
  );
}
