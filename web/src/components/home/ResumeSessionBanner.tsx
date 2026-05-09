"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/session";
import { getRelativeTime } from "@/lib/utils";
import type { ValidationSession } from "@/types";

function getPhaseLabel(phase: ValidationSession["phase"]): string {
  switch (phase) {
    case "brain_dump":
    case "discovery":
      return "Discovery in progress";
    case "research":
      return "Research in progress";
    case "findings":
      return "Research complete";
    case "complete":
      return "Results ready";
  }
}

function truncateIdea(idea: string, maxLen = 80): string {
  if (idea.length <= maxLen) return idea;
  const truncated = idea.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 60 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

export default function ResumeSessionBanner() {
  const [existingSession, setExistingSession] = useState<ValidationSession | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session && session.phase !== "complete") {
      setExistingSession(session);
    }
  }, []);

  if (!existingSession) return null;

  const handleResume = () => {
    router.push("/validate");
  };

  const handleConfirmClear = () => {
    clearSession();
    setExistingSession(null);
    setShowConfirm(false);
  };

  return (
    <div className="mb-[var(--space-8)]">
      <p className="section-label mb-[var(--space-3)]">PREVIOUS SESSION</p>

      <div
        className="rounded-[var(--radius-lg)] border p-[var(--space-5)] mb-[var(--space-4)]"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        <p
          className="font-sans mb-[var(--space-2)]"
          style={{
            fontSize: "var(--text-base)",
            color: "var(--text-primary)",
          }}
        >
          {truncateIdea(existingSession.ideaSummary)}
        </p>
        <p
          className="font-sans mb-[var(--space-1)]"
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-secondary)",
          }}
        >
          Status: {getPhaseLabel(existingSession.phase)}
        </p>
        <p
          className="font-sans"
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-muted)",
          }}
        >
          Last active: {getRelativeTime(existingSession.updatedAt)}
        </p>
      </div>

      <div className="flex items-center gap-[var(--space-4)]">
        <button
          onClick={handleResume}
          className="accent-btn inline-flex items-center justify-center px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-semibold uppercase tracking-[0.08em]"
        >
          RESUME SESSION
        </button>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="font-sans text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Start fresh
          </button>
        ) : (
          <div className="flex items-center gap-[var(--space-3)]">
            <span
              className="font-sans text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Start fresh? Your previous session will be cleared.
            </span>
            <button
              onClick={handleConfirmClear}
              className="accent-btn inline-flex items-center justify-center px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-md)] font-sans text-xs font-semibold uppercase tracking-[0.08em]"
            >
              CONFIRM
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="outline-btn inline-flex items-center justify-center px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-md)] font-sans text-xs font-medium uppercase tracking-[0.08em] border"
            >
              CANCEL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
