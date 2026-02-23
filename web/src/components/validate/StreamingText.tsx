"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cleanAssistantText } from "@/lib/markdown";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
}

export default function StreamingText({ text, isStreaming }: StreamingTextProps) {
  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-supported-fg)", textDecoration: "underline" }}
            >
              {children}
            </a>
          ),
        }}
      >
        {cleanAssistantText(text)}
      </ReactMarkdown>
      {isStreaming && (
        <span
          className="streaming-cursor"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
