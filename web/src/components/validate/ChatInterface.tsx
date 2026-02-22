"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import { useStream } from "@/hooks/useStream";
import { useSession } from "@/hooks/useSession";
import { createSession } from "@/lib/session";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import PhaseIndicator from "./PhaseIndicator";
import SearchingIndicator from "./SearchingIndicator";
import ScorePanel from "./ScorePanel";
import DownloadButton from "./DownloadButton";
import type {
  Message,
  ValidationSession,
  StreamEvent,
  DiscoveryPhase,
  KillSignal,
  ConfidenceScores,
} from "@/types";

const MAX_CHARS = 2000;

// ─── Initial Idea Input ────────────────────────────────────────────────────────

function IdeaInputForm({
  onStart,
  onResume,
}: {
  onStart: (idea: string) => void;
  onResume: () => void;
}) {
  const [idea, setIdea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { session, clearSession } = useSession();

  const hasIncompleteSession = session && session.phase !== "complete";

  useEffect(() => {
    if (!hasIncompleteSession) {
      textareaRef.current?.focus();
    }
  }, [hasIncompleteSession]);

  const charCount = idea.length;
  const charCountColor =
    charCount > MAX_CHARS
      ? "var(--color-contradicted-fg)"
      : charCount > 1800
        ? "var(--color-weak-fg)"
        : "var(--text-muted)";

  const handleSubmit = () => {
    const trimmed = idea.trim();
    if (trimmed.length < 10) {
      setError("Tell us a bit more about the idea");
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      setError("Please keep your idea under 2000 characters");
      return;
    }
    setError(null);
    onStart(trimmed);
  };

  const handleClearAndStart = () => {
    clearSession();
    setShowConfirm(false);
    textareaRef.current?.focus();
  };

  // If there's an existing incomplete session — show resume prompt
  if (hasIncompleteSession) {
    const sessionMeta = session;

    function getRelativeTime(ts: number): string {
      const diffMs = Date.now() - ts;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    }

    function getPhaseLabel(phase: DiscoveryPhase): string {
      switch (phase) {
        case "brain_dump":
        case "discovery": return "Discovery in progress";
        case "research": return "Research in progress";
        case "findings": return "Research complete";
        case "complete": return "Results ready";
      }
    }

    function truncate(s: string, max = 80): string {
      if (s.length <= max) return s;
      const t = s.slice(0, max);
      const last = t.lastIndexOf(" ");
      return (last > 60 ? t.slice(0, last) : t) + "...";
    }

    return (
      <div
        className="mx-auto w-full px-[var(--space-4)] md:px-[var(--space-8)] py-[var(--space-10)]"
        style={{ maxWidth: "720px" }}
      >
        <p className="section-label mb-[var(--space-4)]">PREVIOUS SESSION</p>

        <div
          className="rounded-[var(--radius-lg)] border p-[var(--space-5)] mb-[var(--space-6)]"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-default)",
          }}
        >
          <p
            className="font-mono mb-[var(--space-2)]"
            style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}
          >
            {truncate(sessionMeta.ideaSummary)}
          </p>
          <p
            className="font-mono mb-[var(--space-1)]"
            style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}
          >
            Status: {getPhaseLabel(sessionMeta.phase)}
          </p>
          <p
            className="font-mono"
            style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}
          >
            Last active: {getRelativeTime(sessionMeta.updatedAt)}
          </p>
        </div>

        <div className="flex items-center gap-[var(--space-4)] mb-[var(--space-4)]">
          <button
            onClick={onResume}
            className="accent-btn inline-flex items-center justify-center px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-semibold uppercase tracking-[0.08em]"
          >
            RESUME SESSION
          </button>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="font-mono text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Start fresh
            </button>
          ) : (
            <div className="flex items-center gap-[var(--space-3)] flex-wrap">
              <span className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
                Start fresh? Your previous session will be cleared.
              </span>
              <button
                onClick={handleClearAndStart}
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

  // New session input form
  return (
    <div
      className="mx-auto w-full px-[var(--space-4)] md:px-[var(--space-8)] py-[var(--space-10)]"
      style={{ maxWidth: "720px" }}
    >
      <p className="section-label mb-[var(--space-6)]">FULL VALIDATION</p>

      <div className="mb-[var(--space-4)]">
        <label htmlFor="validate-idea" className="sr-only">
          Describe your product idea
        </label>
        <textarea
          id="validate-idea"
          ref={textareaRef}
          value={idea}
          onChange={(e) => {
            setIdea(e.target.value.slice(0, MAX_CHARS));
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          maxLength={MAX_CHARS}
          placeholder="What's the idea? Tell me what it does, who it's for, and what problem it solves. Raw is fine — we'll dig in together."
          className="w-full rounded-[var(--radius-md)] border font-mono resize-vertical"
          style={{
            minHeight: "160px",
            backgroundColor: "var(--bg-surface)",
            borderColor: error ? "var(--color-contradicted-fg)" : "var(--border-default)",
            color: "var(--text-primary)",
            fontSize: "var(--text-base)",
            lineHeight: "var(--leading-relaxed)",
            padding: "var(--space-4)",
          }}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "validate-idea-error" : "validate-idea-count"}
        />
      </div>

      <div className="flex items-center justify-between mb-[var(--space-4)]">
        <div>
          {error && (
            <p
              id="validate-idea-error"
              className="font-sans text-sm"
              style={{ color: "var(--color-contradicted-fg)" }}
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        <p
          id="validate-idea-count"
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
        className="accent-btn inline-flex w-full sm:w-auto items-center justify-center px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-semibold uppercase tracking-[0.08em] disabled:opacity-40 disabled:cursor-not-allowed mb-[var(--space-3)]"
      >
        START VALIDATION
      </button>

      <p
        className="font-mono"
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--text-muted)",
        }}
      >
        Takes 1-2 hours. ProveIt will ask questions, then research.
      </p>
    </div>
  );
}

// ─── Main ChatInterface ────────────────────────────────────────────────────────

export default function ChatInterface() {
  const { session: storedSession, updateSession } = useSession();
  const { isStreaming, error: streamError, startStream, stopStream } = useStream();

  const [activeSession, setActiveSession] = useState<ValidationSession | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const phaseRef = useRef<DiscoveryPhase>("brain_dump");
  const scoresRef = useRef<ConfidenceScores>({
    desirability: null,
    viability: null,
    feasibility: null,
  });
  const killSignalsRef = useRef<KillSignal[]>([]);

  // Resume from localStorage
  const handleResume = useCallback(() => {
    if (storedSession) {
      setActiveSession(storedSession);
      phaseRef.current = storedSession.phase;
      scoresRef.current = storedSession.scores;
      killSignalsRef.current = storedSession.killSignals;
      setShowChat(true);
    }
  }, [storedSession]);

  // Start a new session
  const handleStart = useCallback((idea: string) => {
    const session = createSession(idea);
    setActiveSession(session);
    phaseRef.current = session.phase;
    scoresRef.current = session.scores;
    killSignalsRef.current = [];
    setShowChat(true);

    // Immediately send first user message and get ProveIt's opening
    sendMessage(idea, session);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    async (text: string, sessionOverride?: ValidationSession) => {
      const currentSession = sessionOverride ?? activeSession;
      if (!currentSession) return;

      // Build updated messages with the new user message
      const userMsg: Message = {
        id: nanoid(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      const updatedMessages: Message[] = [
        ...currentSession.messages,
        userMsg,
      ];

      // Optimistically update session with user message
      const sessionWithUser: ValidationSession = {
        ...currentSession,
        messages: updatedMessages,
        updatedAt: Date.now(),
      };
      setActiveSession(sessionWithUser);

      // Reset streaming state
      setCurrentMessage("");
      setChatError(null);
      setIsSearching(false);

      // Build request payload (strip client-only fields)
      const payload = {
        sessionId: currentSession.id,
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        phase: phaseRef.current,
        scores: scoresRef.current,
      };

      let accumulatedText = "";
      let newPhase = phaseRef.current;
      let newScores = { ...scoresRef.current };
      let newKillSignals = [...killSignalsRef.current];

      const handleText = (chunk: string) => {
        accumulatedText += chunk;
        setCurrentMessage(accumulatedText);
      };

      const handleEvent = (event: StreamEvent) => {
        if (event.type === "searching") {
          setIsSearching(event.active);
        } else if (event.type === "phase_change") {
          newPhase = event.phase;
          phaseRef.current = event.phase;
          setActiveSession((prev) =>
            prev ? { ...prev, phase: event.phase, updatedAt: Date.now() } : prev
          );
        } else if (event.type === "scores") {
          newScores = event.scores;
          scoresRef.current = event.scores;
          setActiveSession((prev) =>
            prev
              ? { ...prev, scores: event.scores, updatedAt: Date.now() }
              : prev
          );
        } else if (event.type === "kill_signal") {
          newKillSignals = [
            ...newKillSignals,
            {
              ...event.signal,
              detectedAt: updatedMessages.length,
            },
          ];
          killSignalsRef.current = newKillSignals;
          setActiveSession((prev) =>
            prev
              ? {
                  ...prev,
                  killSignals: newKillSignals,
                  updatedAt: Date.now(),
                }
              : prev
          );
        } else if (event.type === "error") {
          setChatError(event.message);
        } else if (event.type === "done") {
          setIsSearching(false);
        }
      };

      await startStream("/api/chat", payload, handleText, handleEvent);

      // Stream complete — commit assistant message to session
      if (accumulatedText.trim().length > 0) {
        const assistantMsg: Message = {
          id: nanoid(),
          role: "assistant",
          content: accumulatedText,
          timestamp: Date.now(),
        };

        const finalSession: ValidationSession = {
          ...sessionWithUser,
          messages: [...updatedMessages, assistantMsg],
          phase: newPhase,
          scores: newScores,
          killSignals: newKillSignals,
          researchComplete: newPhase === "findings" || newPhase === "complete",
          updatedAt: Date.now(),
        };

        setActiveSession(finalSession);
        updateSession(finalSession);
      }

      setCurrentMessage("");
      setIsSearching(false);
    },
    [activeSession, startStream, updateSession]
  );

  const handleUserSend = useCallback(
    (text: string) => {
      if (activeSession) {
        sendMessage(text);
      }
    },
    [activeSession, sendMessage]
  );

  const handleStop = useCallback(() => {
    stopStream();
    setIsSearching(false);
    // Commit partial message if any
    if (currentMessage.trim().length > 0 && activeSession) {
      const partialMsg: Message = {
        id: nanoid(),
        role: "assistant",
        content: currentMessage,
        timestamp: Date.now(),
      };
      const finalSession: ValidationSession = {
        ...activeSession,
        messages: [...activeSession.messages, partialMsg],
        updatedAt: Date.now(),
      };
      setActiveSession(finalSession);
      updateSession(finalSession);
    }
    setCurrentMessage("");
  }, [stopStream, currentMessage, activeSession, updateSession]);

  const handleTimeout = useCallback(() => {
    setChatError("Search is taking too long. Please try again.");
    stopStream();
    setIsSearching(false);
  }, [stopStream]);

  // Show input form if no active session
  if (!showChat || !activeSession) {
    return (
      <IdeaInputForm onStart={handleStart} onResume={handleResume} />
    );
  }

  const isComplete = activeSession.phase === "complete";

  return (
    <div className="flex flex-col lg:flex-row flex-1" style={{ maxHeight: "calc(100vh - 56px)" }}>
      {/* Chat column */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Compact idea bar + phase indicator */}
        <div
          className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] border-b shrink-0"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <p
            className="font-mono truncate mr-[var(--space-4)]"
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>Idea: </span>
            {activeSession.ideaSummary.length > 60
              ? activeSession.ideaSummary.slice(0, 60) + "..."
              : activeSession.ideaSummary}
          </p>
          <PhaseIndicator phase={activeSession.phase} />
        </div>

        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto px-[var(--space-4)] md:px-[var(--space-8)] py-[var(--space-6)]"
          style={{ maxWidth: "720px", width: "100%", margin: "0 auto" }}
        >
          <MessageList
            messages={activeSession.messages}
            streamingMessage={isStreaming && currentMessage ? currentMessage : null}
          />

          {/* Searching indicator */}
          {isSearching && (
            <div className="mt-[var(--space-3)]">
              <SearchingIndicator
                isSearching={isSearching}
                onTimeout={handleTimeout}
              />
            </div>
          )}

          {/* Error display */}
          {(chatError || streamError) && (
            <div
              className="mt-[var(--space-4)] rounded-[var(--radius-lg)] border p-[var(--space-4)]"
              style={{
                borderColor: "var(--color-contradicted-fg)",
                backgroundColor: "var(--color-contradicted)",
              }}
              role="alert"
            >
              <p
                className="font-sans text-sm"
                style={{ color: "var(--color-contradicted-fg)" }}
              >
                {chatError || streamError}
              </p>
            </div>
          )}

          {/* Download button — complete phase */}
          {isComplete && (
            <div className="mt-[var(--space-6)] flex flex-col sm:flex-row gap-[var(--space-4)]">
              <DownloadButton session={activeSession} />
            </div>
          )}
        </div>

        {/* Chat input bar — sticky bottom */}
        <div className="shrink-0">
          <ChatInput
            onSend={handleUserSend}
            onStop={handleStop}
            isStreaming={isStreaming}
            isDisabled={isComplete}
            phase={activeSession.phase}
          />
        </div>
      </div>

      {/* Score panel — sidebar on desktop */}
      <div
        className="lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l p-[var(--space-4)] overflow-y-auto"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <ScorePanel
          scores={activeSession.scores}
          killSignals={activeSession.killSignals}
          phase={activeSession.phase}
        />
      </div>
    </div>
  );
}
