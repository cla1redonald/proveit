import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSession, getSession, updateSession, clearSession } from "@/lib/session";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("session.ts", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("createSession", () => {
    it("creates a new session with correct default values", () => {
      const session = createSession("A task management tool for remote teams");
      expect(session.phase).toBe("brain_dump");
      expect(session.messages).toHaveLength(0);
      expect(session.scores.desirability).toBeNull();
      expect(session.scores.viability).toBeNull();
      expect(session.scores.feasibility).toBeNull();
      expect(session.killSignals).toHaveLength(0);
      expect(session.researchComplete).toBe(false);
      expect(session.id).toBeTruthy();
      expect(session.createdAt).toBeTruthy();
    });

    it("persists session to localStorage", () => {
      const idea = "A habit tracker for remote teams";
      createSession(idea);
      const raw = localStorage.getItem("proveit_session");
      expect(raw).not.toBeNull();
      const stored = JSON.parse(raw!);
      expect(stored.version).toBe(1);
      expect(stored.session.ideaSummary).toContain(idea.slice(0, 50));
    });
  });

  describe("getSession", () => {
    it("returns null when no session is stored", () => {
      const session = getSession();
      expect(session).toBeNull();
    });

    it("returns the stored session", () => {
      const created = createSession("My product idea");
      const retrieved = getSession();
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
    });

    it("returns null and clears storage when schema version mismatches", () => {
      localStorage.setItem(
        "proveit_session",
        JSON.stringify({ version: 99, session: { id: "old" } })
      );
      const session = getSession();
      expect(session).toBeNull();
      expect(localStorage.getItem("proveit_session")).toBeNull();
    });

    it("returns null when localStorage contains invalid JSON", () => {
      localStorage.setItem("proveit_session", "not valid json");
      const session = getSession();
      expect(session).toBeNull();
    });
  });

  describe("updateSession", () => {
    it("updates the stored session", () => {
      const session = createSession("My product idea");
      const updated = { ...session, phase: "discovery" as const };
      updateSession(updated);

      const retrieved = getSession();
      expect(retrieved!.phase).toBe("discovery");
    });

    it("sets updatedAt timestamp on update", () => {
      const session = createSession("My product idea");
      const beforeUpdate = Date.now();
      updateSession(session);
      const retrieved = getSession();
      expect(retrieved!.updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
    });
  });

  describe("clearSession", () => {
    it("removes the session from localStorage", () => {
      createSession("My product idea");
      expect(getSession()).not.toBeNull();
      clearSession();
      expect(getSession()).toBeNull();
    });

    it("does not throw if localStorage is empty", () => {
      expect(() => clearSession()).not.toThrow();
    });
  });
});
