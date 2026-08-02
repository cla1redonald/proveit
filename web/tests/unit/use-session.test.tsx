import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSession } from "@/hooks/useSession";
import { createSession, getSession } from "@/lib/session";

describe("useSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads an existing session from localStorage on mount", async () => {
    createSession("An async standup tool for distributed teams");

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.session).not.toBeNull();
    });

    expect(result.current.session?.ideaSummary).toBe(
      "An async standup tool for distributed teams",
    );
    expect(result.current.session?.phase).toBe("brain_dump");
  });

  it("updates session state and localStorage together", async () => {
    const created = createSession("Initial idea for validation testing");
    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.session?.id).toBe(created.id));

    const updated = {
      ...created,
      phase: "discovery" as const,
      ideaSummary: "Refined idea summary",
    };

    act(() => {
      result.current.updateSession(updated);
    });

    expect(result.current.session?.phase).toBe("discovery");
    expect(getSession()?.phase).toBe("discovery");
    expect(getSession()?.ideaSummary).toBe("Refined idea summary");
  });

  it("clears session state and localStorage", async () => {
    createSession("Temporary idea to clear");
    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.session).not.toBeNull());

    act(() => {
      result.current.clearSession();
    });

    expect(result.current.session).toBeNull();
    expect(getSession()).toBeNull();
  });
});
