"use client";

import { useEffect, useState } from "react";
import FastInput from "./FastInput";
import FastStream from "./FastStream";

const STORAGE_KEY = "proveit_fast_idea";

export default function FastPageContent() {
  const [idea, setIdea] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim().length >= 10) {
        setIdea(stored.trim());
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // sessionStorage may throw in private browsing — fall through to input
    }
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return idea ? <FastStream idea={idea} /> : <FastInput />;
}
