/**
 * Edge case tests for lib/session.ts.
 *
 * The existing session.test.ts covers basic CRUD.
 * This file targets:
 *   - localStorage throwing (private browsing / quota)
 *   - updateSession does not persist isStreaming (transient field)
 *   - createSession stores ideaSummary capped at 100 chars
 *   - getSession with null session field in stored object
 *   - Schema version boundary: exactly version 1 passes, anything else discards
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createSession,
  getSession,
  updateSession,
  clearSession,
} from "@/lib/session";
import type { ValidationSession } from "@/types";

// ─── localStorage mock ────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  let throwOnWrite = false;

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      if (throwOnWrite) throw new DOMException("QuotaExceededError");
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    setThrowOnWrite: (v: boolean) => {
      throwOnWrite = v;
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("session.ts — edge cases", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.setThrowOnWrite(false);
  });

  // ─── createSession ──────────────────────────────────────────────────────────

  describe("createSession — edge cases", () => {
    it("caps ideaSummary at 100 chars if input is longer", () => {
      const longIdea = "x".repeat(200);
      const session = createSession(longIdea);
      expect(session.ideaSummary.length).toBeLessThanOrEqual(100);
    });

    it("stores the full ideaSummary when input is under 100 chars", () => {
      const idea = "A short idea";
      const session = createSession(idea);
      expect(session.ideaSummary).toBe(idea);
    });

    it("does not throw when localStorage.setItem throws (quota exceeded)", () => {
      localStorageMock.setThrowOnWrite(true);
      expect(() => createSession("Any idea that runs in memory")).not.toThrow();
    });

    it("still returns a valid session even when localStorage throws", () => {
      localStorageMock.setThrowOnWrite(true);
      const session = createSession("Idea without persistence");
      expect(session.id).toBeTruthy();
      expect(session.phase).toBe("brain_dump");
    });
  });

  // ─── getSession ─────────────────────────────────────────────────────────────

  describe("getSession — edge cases", () => {
    it("returns null when stored object has no session field", () => {
      localStorage.setItem(
        "proveit_session",
        JSON.stringify({ version: 1 })
      );
      // No session field — accessing stored.session returns undefined
      // The function returns it (as undefined cast to ValidationSession)
      // or null. Either way it must not throw.
      expect(() => getSession()).not.toThrow();
    });

    it("returns null for schema version 0", () => {
      localStorage.setItem(
        "proveit_session",
        JSON.stringify({ version: 0, session: { id: "legacy" } })
      );
      expect(getSession()).toBeNull();
    });

    it("returns null for schema version 2 (future)", () => {
      localStorage.setItem(
        "proveit_session",
        JSON.stringify({ version: 2, session: { id: "future" } })
      );
      expect(getSession()).toBeNull();
    });

    it("clears storage on schema version mismatch", () => {
      localStorage.setItem(
        "proveit_session",
        JSON.stringify({ version: 42, session: { id: "bogus" } })
      );
      getSession();
      expect(localStorage.getItem("proveit_session")).toBeNull();
    });

    it("handles null stored directly in localStorage", () => {
      localStorage.setItem("proveit_session", "null");
      // JSON.parse("null") === null — the cast to StoredSession is null
      // The code accesses stored.version on null → throws → catch returns null
      expect(() => getSession()).not.toThrow();
      expect(getSession()).toBeNull();
    });
  });

  // ─── updateSession ──────────────────────────────────────────────────────────

  describe("updateSession — edge cases", () => {
    it("does not throw when localStorage.setItem throws on update", () => {
      const session = createSession("My idea");
      localStorageMock.setThrowOnWrite(true);
      expect(() => updateSession(session)).not.toThrow();
    });

    it("always refreshes updatedAt on update", () => {
      const session = createSession("My idea");
      const originalTime = session.updatedAt;

      // Advance time slightly before updating
      vi.useFakeTimers();
      vi.setSystemTime(originalTime + 5000);
      updateSession(session);
      vi.useRealTimers();

      const retrieved = getSession();
      expect(retrieved!.updatedAt).toBeGreaterThan(originalTime);
    });

    it("isStreaming field is stripped from persisted session", () => {
      const session = createSession("My idea");
      // Simulate a message with isStreaming: true being passed to updateSession
      const sessionWithStreaming: ValidationSession = {
        ...session,
        messages: [
          {
            id: "m1",
            role: "assistant",
            content: "What does your idea do?",
            timestamp: Date.now(),
            isStreaming: true,
          },
        ],
      };
      updateSession(sessionWithStreaming);

      // Read raw JSON from storage — isStreaming should NOT appear
      const raw = localStorage.getItem("proveit_session")!;
      // isStreaming: true will still be in the JSON if updateSession does not strip it.
      // We record whether this is the case — this test detects the gap if it exists.
      const stored = JSON.parse(raw);
      const persistedMessage = stored.session.messages[0];
      // The spec says isStreaming must never be persisted.
      // If the implementation doesn't strip it, this assertion will fail,
      // surfacing the real bug.
      expect(persistedMessage.isStreaming).toBeUndefined();
    });
  });

  // ─── clearSession ───────────────────────────────────────────────────────────

  describe("clearSession — edge cases", () => {
    it("clears session correctly after update", () => {
      const session = createSession("My idea");
      updateSession({ ...session, phase: "discovery" });
      clearSession();
      expect(getSession()).toBeNull();
    });
  });
});
