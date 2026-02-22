"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStream } from "@/hooks/useStream";
import AssumptionCard from "./AssumptionCard";
import StreamingIndicator from "./StreamingIndicator";
import type { AssumptionResult, Verdict, StreamEvent } from "@/types";

interface FastStreamProps {
  idea: string;
}

interface ParsedAssumption {
  category: string;
  statement: string;
  verdict: Verdict | null;
  evidenceLines: string[];
  isComplete: boolean;
}

function parseAssumptions(text: string): ParsedAssumption[] {
  const results: ParsedAssumption[] = [];

  // Split on assumption headers
  const assumptionRegex = /\*\*Assumption\s+\d+:\s*([^*]+)\*\*/g;
  const matches = [...text.matchAll(assumptionRegex)];

  if (matches.length === 0) return results;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const start = match.index ?? 0;
    const end = matches[i + 1]?.index ?? text.length;
    const block = text.slice(start, end);

    // Parse category and statement from "Category — Statement"
    const headerText = match[1].trim();
    const dashIdx = headerText.indexOf("—");
    const category = dashIdx >= 0 ? headerText.slice(0, dashIdx).trim() : headerText;
    const statement = dashIdx >= 0 ? headerText.slice(dashIdx + 1).trim() : "";

    // Parse verdict
    const verdictMatch = block.match(/Verdict:\s*(SUPPORTED|WEAK|CONTRADICTED)/i);
    const verdict = verdictMatch
      ? (verdictMatch[1].toUpperCase() as Verdict)
      : null;

    // Parse evidence lines
    const evidenceLines: string[] = [];
    const evidenceSection = block.split(/Evidence:/i)[1] ?? "";
    const bulletMatches = evidenceSection.match(/^[-*]\s+.+/gm);
    if (bulletMatches) {
      evidenceLines.push(...bulletMatches.map((l) => l.replace(/^[-*]\s+/, "").trim()));
    }

    // A block is complete if the next assumption starts or we've found a verdict
    const isComplete = i < matches.length - 1 || verdict !== null;

    results.push({ category, statement, verdict, evidenceLines, isComplete });
  }

  return results;
}

function buildAssumptionResult(parsed: ParsedAssumption): AssumptionResult {
  return {
    assumption: parsed.statement || parsed.category,
    category: parsed.category.includes("Viability")
      ? "Viability"
      : parsed.category.includes("Competition") || parsed.category.includes("Competitor")
        ? "Competition"
        : "Desirability",
    verdict: parsed.verdict ?? "WEAK",
    evidence: parsed.evidenceLines.slice(0, 4).map((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0 && colonIdx < 80) {
        return {
          source: line.slice(0, colonIdx).trim(),
          finding: line.slice(colonIdx + 1).trim(),
        };
      }
      return { source: "", finding: line };
    }),
  };
}

function extractQuickVerdict(text: string): string {
  const match = text.match(/\*\*Quick verdict:\*\*\s*(.+?)(?:\n|$)/);
  return match ? match[1].trim() : "";
}

export default function FastStream({ idea }: FastStreamProps) {
  const router = useRouter();
  const { isStreaming, error, startStream } = useStream();
  const [streamText, setStreamText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const hasStarted = useRef(false);

  // Clear searching indicator when stream ends or errors — guards against
  // connection drops that produce no stream events.
  useEffect(() => {
    if (!isStreaming) {
      setIsSearching(false);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (error) {
      setIsSearching(false);
    }
  }, [error]);

  const handleText = useCallback((chunk: string) => {
    setStreamText((prev) => prev + chunk);
  }, []);

  const handleEvent = useCallback((event: StreamEvent) => {
    if (event.type === "searching") {
      setIsSearching(event.active);
    } else if (event.type === "done") {
      setIsComplete(true);
      setIsSearching(false);
    } else if (event.type === "error") {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    startStream(
      "/api/fast",
      { idea },
      handleText,
      handleEvent
    ).then(() => {
      setIsComplete(true);
    });
  }, [idea, startStream, handleText, handleEvent]);

  const parsedAssumptions = parseAssumptions(streamText);
  const quickVerdict = extractQuickVerdict(streamText);

  const handleCheckAnother = () => {
    router.push("/fast");
  };

  const handleFullValidation = () => {
    router.push("/validate");
  };

  return (
    <div>
      {/* Section label */}
      <p className="section-label mb-[var(--space-6)]">FAST CHECK</p>

      {/* Idea summary */}
      <p
        className="font-mono mb-[var(--space-6)]"
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
          opacity: isStreaming ? 0.6 : 1,
          transition: "opacity var(--duration-base)",
        }}
      >
        {idea.length > 120 ? idea.slice(0, 120) + "..." : idea}
      </p>

      {/* Searching indicator */}
      {isSearching && (
        <div
          className="mb-[var(--space-4)] flex items-center gap-[var(--space-3)]"
          role="status"
          aria-live="polite"
          aria-label="Searching the web for evidence"
        >
          <span className="section-label">SEARCHING THE WEB</span>
          <div className="search-dots flex gap-1">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      {/* Loading indicator — while stream is starting */}
      {isStreaming && streamText.length === 0 && !isSearching && (
        <StreamingIndicator />
      )}

      {/* Streaming raw text — shown while parsing is in progress */}
      {!isComplete && streamText.length > 0 && parsedAssumptions.length === 0 && (
        <div
          className="font-mono whitespace-pre-wrap"
          style={{
            fontSize: "var(--text-base)",
            lineHeight: "var(--leading-relaxed)",
            color: "var(--text-primary)",
          }}
          aria-busy={isStreaming}
        >
          {streamText}
          {isStreaming && <span className="streaming-cursor" aria-label="ProveIt is typing" />}
        </div>
      )}

      {/* Assumption cards */}
      {parsedAssumptions.length > 0 && (
        <div className="space-y-[var(--space-4)]">
          {parsedAssumptions.map((parsed, idx) => {
            const result = buildAssumptionResult(parsed);
            const isThisCardStreaming =
              isStreaming && idx === parsedAssumptions.length - 1 && !parsed.isComplete;

            return (
              <AssumptionCard
                key={idx}
                assumption={result}
                index={idx + 1}
                isStreaming={isThisCardStreaming}
                showVerdict={parsed.verdict !== null}
              />
            );
          })}
        </div>
      )}

      {/* Quick verdict */}
      {quickVerdict && (
        <div
          className="mt-[var(--space-8)]"
          style={{
            animation: "card-enter 0.3s ease-out forwards",
          }}
        >
          <p className="section-label mb-[var(--space-3)]">QUICK VERDICT</p>
          <p
            className="font-mono"
            style={{
              fontSize: "var(--text-base)",
              lineHeight: "var(--leading-relaxed)",
              color: "var(--text-secondary)",
            }}
          >
            {quickVerdict}
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="mt-[var(--space-6)] rounded-[var(--radius-lg)] border p-[var(--space-5)]"
          style={{
            borderColor: "var(--color-contradicted-fg)",
            backgroundColor: "var(--color-contradicted)",
          }}
        >
          <p
            className="font-mono mb-[var(--space-3)]"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
            }}
          >
            Something went wrong. Try again.
          </p>
          <button
            onClick={() => {
              setStreamText("");
              setIsComplete(false);
              hasStarted.current = false;
              startStream("/api/fast", { idea }, handleText, handleEvent);
            }}
            className="outline-btn inline-flex items-center justify-center px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-md)] font-sans text-xs font-medium uppercase tracking-[0.08em] border"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* Action buttons — shown when complete */}
      {isComplete && !error && (
        <div
          className="mt-[var(--space-8)] flex flex-col sm:flex-row gap-[var(--space-3)]"
          style={{ animation: "card-enter 0.3s ease-out forwards" }}
        >
          <button
            onClick={handleFullValidation}
            className="accent-btn inline-flex items-center justify-center px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-semibold uppercase tracking-[0.08em]"
          >
            RUN FULL VALIDATION
          </button>
          <button
            onClick={handleCheckAnother}
            className="outline-btn inline-flex items-center justify-center px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-medium uppercase tracking-[0.08em] border"
          >
            CHECK ANOTHER IDEA
          </button>
        </div>
      )}
    </div>
  );
}
