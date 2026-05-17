"use client";

import type { DiscoveryPhase } from "@/types";

interface PhaseIndicatorProps {
  phase: DiscoveryPhase;
}

const PHASES: { key: DiscoveryPhase[]; label: string }[] = [
  { key: ["brain_dump"], label: "BRAIN DUMP" },
  { key: ["discovery"], label: "DISCOVERY" },
  { key: ["research"], label: "RESEARCH" },
  { key: ["findings", "complete"], label: "RESULTS" },
];

function getActiveStep(phase: DiscoveryPhase): number {
  for (let i = 0; i < PHASES.length; i++) {
    if ((PHASES[i].key as DiscoveryPhase[]).includes(phase)) return i;
  }
  return 0;
}

export default function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const activeStep = getActiveStep(phase);
  const isActive = phase !== "complete";
  const activeLabel = PHASES[activeStep].label;

  return (
    <>
      {/* Mobile (<640px): compact "N/4 · ACTIVE_LABEL" so the row fits next to the idea bar */}
      <div className="sm:hidden flex items-center gap-[var(--space-2)] shrink-0">
        <span
          className="font-sans"
          style={{
            fontSize: "var(--text-xs)",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
          }}
          aria-hidden="true"
        >
          {activeStep + 1}/{PHASES.length}
        </span>
        <span
          className="font-sans"
          style={{
            fontSize: "var(--text-xs)",
            letterSpacing: "0.08em",
            color: "var(--text-primary)",
            fontWeight: 500,
          }}
          aria-label={`Phase ${activeStep + 1} of ${PHASES.length}: ${activeLabel}`}
        >
          {activeLabel}
        </span>
        {isActive && (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: "var(--color-accent)",
              animation: "dot-pulse 1.4s ease-in-out infinite",
            }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Desktop (≥640px): full chain */}
      <div className="hidden sm:flex items-center gap-[var(--space-4)]">
        {PHASES.map((p, i) => {
          const isCurrentStep = i === activeStep;
          return (
            <div key={p.label} className="flex items-center gap-[var(--space-2)]">
              <span
                className="font-sans"
                style={{
                  fontSize: "var(--text-xs)",
                  letterSpacing: "0.08em",
                  color: isCurrentStep
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                  fontWeight: isCurrentStep ? 500 : 400,
                  transition: "color var(--duration-base)",
                }}
              >
                {p.label}
              </span>
              {isCurrentStep && isActive && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    animation: "dot-pulse 1.4s ease-in-out infinite",
                  }}
                  aria-hidden="true"
                />
              )}
              {i < PHASES.length - 1 && (
                <span
                  className="font-sans"
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-muted)",
                    marginLeft: "var(--space-2)",
                  }}
                >
                  /
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
