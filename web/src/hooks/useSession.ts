"use client";

import { useState, useEffect, useCallback } from "react";
import { getSession, updateSession, clearSession } from "@/lib/session";
import type { ValidationSession } from "@/types";

export function useSession() {
  const [session, setSession] = useState<ValidationSession | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const handleUpdateSession = useCallback((updated: ValidationSession) => {
    updateSession(updated);
    setSession(updated);
  }, []);

  const handleClearSession = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return {
    session,
    updateSession: handleUpdateSession,
    clearSession: handleClearSession,
  };
}
