"use client";

import type { ConfidenceScores, KillSignal, DiscoveryPhase } from "@/types";

interface ScorePanelProps {
  scores: ConfidenceScores;
  killSignals: KillSignal[];
  phase: DiscoveryPhase;
}

function scoreColor(score: number | null): string {
  if (score === null) return "var(--text-muted)";
  if (score <= 3) return "var(--color-contradicted-fg)";
  if (score <= 7) return "var(--color-weak-fg)";
  return "var(--color-supported-fg)";
}

function killSignalLabel(type: KillSignal["type"]): string {
  switch (type) {
    case "tarpit": return "Tarpit";
    case "saturation": return "Market Saturation";
    case "no_switching": return "No Switching Evidence";
    case "no_willingness_to_pay": return "No Willingness to Pay";
  }
}

export default function ScorePanel({
  scores,
  killSignals,
  phase,
}: ScorePanelProps) {
  const hasScores =
    scores.desirability !== null ||
    scores.viability !== null ||
    scores.feasibility !== null;

  if (!hasScores && killSignals.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-lg)] border p-[var(--space-5)]"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        <p className="section-label mb-[var(--space-3)]">CONFIDENCE SCORES</p>
        <p
          className="font-mono"
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
          }}
        >
          Scores will appear as research progresses.
        </p>
      </div>
    );
  }

  const scoreRows: { label: string; value: number | null }[] = [
    { label: "DESIRABILITY", value: scores.desirability },
    { label: "VIABILITY", value: scores.viability },
    { label: "FEASIBILITY", value: scores.feasibility },
  ];

  return (
    <div
      className="rounded-[var(--radius-lg)] border p-[var(--space-5)] space-y-[var(--space-4)]"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <p className="section-label">CONFIDENCE SCORES</p>

      <div className="space-y-[var(--space-3)]">
        {scoreRows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center justify-between"
            style={{
              borderBottom:
                i < scoreRows.length - 1
                  ? "1px solid var(--border-subtle)"
                  : "none",
              paddingBottom: i < scoreRows.length - 1 ? "var(--space-3)" : 0,
            }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: "var(--text-xs)",
                letterSpacing: "0.08em",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
              }}
            >
              {row.label}
            </span>
            <span
              className="font-mono font-medium tabular-nums"
              style={{
                fontSize: "var(--text-xl)",
                color: scoreColor(row.value),
                transition: "color var(--duration-base)",
              }}
            >
              {row.value !== null ? `${row.value}/10` : "—"}
            </span>
          </div>
        ))}
      </div>

      {killSignals.length > 0 && (
        <div>
          <p className="section-label mb-[var(--space-2)]">KILL SIGNALS</p>
          <div className="space-y-[var(--space-2)]">
            {killSignals.map((signal, i) => (
              <div
                key={i}
                className="rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-2)]"
                style={{
                  backgroundColor: "var(--color-kill-signal)",
                  borderLeft: "3px solid var(--color-kill-signal-fg)",
                }}
                role="alert"
              >
                <p
                  className="font-mono font-medium"
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-kill-signal-fg)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {killSignalLabel(signal.type)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {killSignals.length === 0 && phase === "complete" && (
        <div>
          <p className="section-label mb-[var(--space-2)]">KILL SIGNALS</p>
          <p
            className="font-mono"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-muted)",
            }}
          >
            None detected.
          </p>
        </div>
      )}
    </div>
  );
}
