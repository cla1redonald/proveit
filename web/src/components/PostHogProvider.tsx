"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/posthog";

/**
 * Mount-once PostHog initialiser. Sits in the root layout below <body> so it
 * runs on every page, after hydration. Quiet no-op when env vars are missing.
 */
export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}
