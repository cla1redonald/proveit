"use client";

import { useEffect, useState } from "react";

interface SearchingIndicatorProps {
  isSearching: boolean;
  onTimeout: () => void;
}

export default function SearchingIndicator({
  isSearching,
  onTimeout,
}: SearchingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isSearching) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= 60) {
          onTimeout();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSearching, onTimeout]);

  if (!isSearching) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Searching the web for evidence"
      className="flex flex-col gap-[var(--space-2)]"
    >
      <div className="flex items-center gap-[var(--space-3)]">
        <span className="section-label">SEARCHING THE WEB</span>
        <div className="search-dots flex gap-1">
          <span />
          <span />
          <span />
        </div>
      </div>
      {elapsed >= 15 && elapsed < 60 && (
        <p
          className="font-mono"
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-muted)",
          }}
        >
          Still searching... this can take up to 30 seconds.
        </p>
      )}
    </div>
  );
}
