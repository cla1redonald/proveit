"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const MAX_CHARS = 2000;

export default function FastInput() {
  const [idea, setIdea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const charCount = idea.length;
  const isValid = charCount >= 10 && charCount <= MAX_CHARS;

  const charCountColor =
    charCount > MAX_CHARS
      ? "var(--color-contradicted-fg)"
      : charCount > 1800
        ? "var(--color-weak-fg)"
        : "var(--text-muted)";

  const handleSubmit = () => {
    if (!isValid) {
      if (charCount < 10) {
        setError("Tell us a bit more about the idea");
      } else {
        setError("Please keep your idea under 2000 characters");
      }
      return;
    }
    setError(null);
    router.push(`/fast?idea=${encodeURIComponent(idea.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div>
      <p className="section-label mb-[var(--space-6)]">FAST CHECK</p>

      <div className="mb-[var(--space-4)]">
        <label
          htmlFor="fast-idea"
          className="sr-only"
        >
          Describe your product idea
        </label>
        <textarea
          id="fast-idea"
          ref={textareaRef}
          value={idea}
          onChange={(e) => {
            setIdea(e.target.value.slice(0, MAX_CHARS));
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_CHARS}
          placeholder="What's the idea? Describe it in plain terms — who it's for, what problem it solves, and what they do today instead."
          className="w-full rounded-[var(--radius-md)] border font-mono resize-vertical"
          style={{
            minHeight: "120px",
            backgroundColor: "var(--bg-surface)",
            borderColor: error ? "var(--color-contradicted-fg)" : "var(--border-default)",
            color: "var(--text-primary)",
            fontSize: "var(--text-base)",
            lineHeight: "var(--leading-relaxed)",
            padding: "var(--space-4)",
          }}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "fast-idea-error" : "fast-idea-count"}
        />
      </div>

      <div className="flex items-center justify-between mb-[var(--space-4)]">
        <div>
          {error && (
            <p
              id="fast-idea-error"
              className="font-sans text-sm"
              style={{ color: "var(--color-contradicted-fg)" }}
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        <p
          id="fast-idea-count"
          className="font-mono text-xs tabular-nums"
          style={{ color: charCountColor }}
          aria-live="polite"
        >
          {charCount} / {MAX_CHARS}
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={charCount === 0}
        className="accent-btn inline-flex w-full sm:w-auto items-center justify-center px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-semibold uppercase tracking-[0.08em] disabled:opacity-40 disabled:cursor-not-allowed"
        aria-disabled={charCount === 0}
      >
        RUN FAST CHECK
      </button>
    </div>
  );
}
