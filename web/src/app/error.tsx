"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/posthog";

/**
 * Route-level error boundary (Next.js App Router).
 *
 * Catches uncaught errors rendered in any page below /app and reports them
 * to PostHog only when the visitor has opted into analytics.
 *
 * PII discipline: we only pass the Error object (name, message, stack). We
 * do NOT include any user-typed content — the idea text and chat messages
 * stay private.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { source: "app_route_error_boundary" });
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-[var(--space-8)]"
      style={{ background: "var(--bg-canvas)" }}
    >
      <div
        className="max-w-md text-center flex flex-col gap-[var(--space-4)]"
        style={{ color: "var(--text-primary)" }}
      >
        <h1
          className="font-display text-2xl"
          style={{ color: "var(--heading, #111a24)" }}
        >
          Something went wrong.
        </h1>
        <p className="font-sans text-sm" style={{ color: "var(--text-secondary)" }}>
          The page hit an unexpected error. The maintainer has been notified.
        </p>
        <button
          type="button"
          onClick={reset}
          className="outline-btn self-center inline-flex items-center justify-center px-[var(--space-5)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-medium border"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
