"use client";

import { useState } from "react";
import type { AssumptionResult, Verdict } from "@/types";

interface AssumptionCardProps {
  assumption: AssumptionResult;
  index: number;
  isStreaming?: boolean;
  showVerdict?: boolean;
}

function verdictVariant(verdict: Verdict): {
  bg: string;
  fg: string;
  border: string;
} {
  switch (verdict) {
    case "SUPPORTED":
      return {
        bg: "var(--color-supported)",
        fg: "var(--color-supported-fg)",
        border: "var(--color-supported-fg)",
      };
    case "WEAK":
      return {
        bg: "var(--color-weak)",
        fg: "var(--color-weak-fg)",
        border: "var(--color-weak-fg)",
      };
    case "CONTRADICTED":
      return {
        bg: "var(--color-contradicted)",
        fg: "var(--color-contradicted-fg)",
        border: "var(--color-contradicted-fg)",
      };
  }
}

export default function AssumptionCard({
  assumption,
  index,
  isStreaming = false,
  showVerdict = true,
}: AssumptionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const colors = verdictVariant(assumption.verdict);

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-surface)",
    borderColor: "var(--border-default)",
    borderLeftWidth: "3px",
    borderLeftColor: showVerdict ? colors.border : "var(--border-default)",
    transition: `border-left-color var(--duration-base)`,
    animationDelay: `${(index - 1) * 80}ms`,
  };

  return (
    <article
      className="assumption-card-enter rounded-[var(--radius-lg)] border p-[var(--space-6)] shadow-[var(--shadow-sm)]"
      style={cardStyle}
      aria-label={`Assumption ${index} of 3`}
    >
      {/* Section label */}
      <p className="section-label mb-[var(--space-3)]">
        ASSUMPTION {String(index).padStart(2, "0")}
      </p>

      {/* Verdict badge */}
      {showVerdict && (
        <div
          className="inline-flex items-center rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1)] mb-[var(--space-3)]"
          style={{
            backgroundColor: colors.bg,
            color: colors.fg,
            fontSize: "var(--text-xs)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            animation: "card-enter 0.2s ease-out forwards",
          }}
          role="status"
          aria-label={`Verdict: ${assumption.verdict}`}
        >
          <span
            style={{ fontSize: "var(--text-xs)" }}
            className="sr-only"
          >
            Verdict:
          </span>
          {assumption.verdict}
        </div>
      )}

      {/* Assumption title */}
      <h2
        className="font-mono font-medium mb-[var(--space-4)]"
        style={{
          fontSize: "var(--text-lg)",
          lineHeight: "var(--leading-snug)",
          color: "var(--text-primary)",
        }}
      >
        {assumption.assumption || assumption.category}
        {isStreaming && (
          <span
            className="streaming-cursor"
            aria-label="ProveIt is typing"
            aria-hidden="true"
          />
        )}
      </h2>

      {/* Evidence */}
      {assumption.evidence.length > 0 && (
        <div>
          <button
            className="w-full text-left"
            onClick={() => setIsExpanded((e) => !e)}
            aria-expanded={isExpanded}
          >
            <p
              className="font-mono font-medium mb-[var(--space-2)]"
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
              }}
            >
              Evidence{" "}
              <span
                style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}
              >
                ({isExpanded ? "collapse" : "expand"})
              </span>
            </p>
          </button>

          {isExpanded && (
            <ul className="space-y-[var(--space-3)]">
              {assumption.evidence.map((item, i) => (
                <li key={i}>
                  {item.source && (
                    <p
                      className="font-mono"
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--text-secondary)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {item.source}
                    </p>
                  )}
                  <p
                    className="font-mono"
                    style={{
                      fontSize: "var(--text-sm)",
                      lineHeight: "var(--leading-relaxed)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.finding}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* No evidence yet — streaming placeholder */}
      {assumption.evidence.length === 0 && isStreaming && (
        <p
          className="font-mono"
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
          }}
        >
          Gathering evidence...
        </p>
      )}
    </article>
  );
}
