// Client-side utility — do NOT add "server-only" import here

import { nanoid } from "nanoid";
import type { ValidationSession, StoredSession } from "@/types";

const STORAGE_KEY = "proveit_session";
const SCHEMA_VERSION = 1;

export function createSession(ideaText: string): ValidationSession {
  const session: ValidationSession = {
    id: nanoid(),
    ideaSummary: ideaText.slice(0, 100),
    phase: "brain_dump",
    messages: [],
    scores: { desirability: null, viability: null, feasibility: null },
    killSignals: [],
    researchComplete: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    const stored: StoredSession = { version: 1, session };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage unavailable — session runs in memory only
  }

  return session;
}

export function getSession(): ValidationSession | null {
  // Schema mismatch triggers discard-and-restart — this IS the migration strategy.
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredSession;
    if (stored.version !== SCHEMA_VERSION) {
      // Schema mismatch — discard and start fresh
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return stored.session;
  } catch {
    return null;
  }
}

export function updateSession(session: ValidationSession): void {
  try {
    // Strip transient isStreaming flag from messages before persisting.
    // isStreaming is React-only state and must never be written to localStorage.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const messagesForStorage = session.messages.map(({ isStreaming: _isStreaming, ...msg }) => msg);
    const stored: StoredSession = {
      version: SCHEMA_VERSION,
      session: { ...session, messages: messagesForStorage, updatedAt: Date.now() },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage unavailable — no-op, session runs in memory
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable — no-op
  }
}
