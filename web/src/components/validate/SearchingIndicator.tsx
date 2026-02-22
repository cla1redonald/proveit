"use client";

import { useEffect, useState } from "react";

interface SearchingIndicatorProps {
  isSearching: boolean;
  searches: string[]; // completed search queries
  currentQuery: string | null; // in-progress query
  onTimeout: () => void;
}

export default function SearchingIndicator({
  isSearching,
  searches,
  currentQuery,
  onTimeout,
}: SearchingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);
  const hasActivity = isSearching || searches.length > 0;

  useEffect(() => {
    if (!isSearching) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= 120) onTimeout();
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSearching, onTimeout]);

  if (!hasActivity) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-[var(--radius-lg)] border p-[var(--space-4)]"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <p className="section-label mb-[var(--space-3)]">RESEARCH IN PROGRESS</p>

      <div className="flex flex-col gap-[var(--space-2)]">
        {/* Completed searches */}
        {searches.map((query, i) => (
          <div key={i} className="flex items-start gap-[var(--space-2)]">
            <span
              className="font-mono shrink-0 mt-px"
              style={{ fontSize: "var(--text-xs)", color: "var(--color-supported-fg)" }}
            >
              ✓
            </span>
            <p
              className="font-mono"
              style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}
            >
              {query}
            </p>
          </div>
        ))}

        {/* Current in-progress search */}
        {isSearching && (
          <div className="flex items-start gap-[var(--space-2)]">
            <div className="search-dots flex gap-1 shrink-0 mt-[3px]">
              <span />
              <span />
              <span />
            </div>
            <p
              className="font-mono"
              style={{ fontSize: "var(--text-xs)", color: "var(--text-primary)" }}
            >
              {currentQuery ?? "Searching the web..."}
            </p>
          </div>
        )}

        {elapsed >= 30 && elapsed < 120 && (
          <p
            className="font-mono mt-[var(--space-1)]"
            style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}
          >
            Still researching — this can take a minute or two.
          </p>
        )}
      </div>
    </div>
  );
}
