"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Root-level error boundary (Next.js App Router).
 *
 * Fires for errors in the root layout / providers, which the route-level
 * error.tsx cannot catch. Must include its own <html> + <body>.
 *
 * PII: we only pass the Error object. No idea text, no chat content.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error, { source: "app_global_error_boundary" });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: "48px 24px",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#faf6f1",
          color: "#2d2a26",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1
            style={{
              margin: "0 0 16px",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 24,
              fontWeight: 500,
              color: "#111a24",
            }}
          >
            ProveIt is having a moment.
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b5d4f" }}>
            Something deep in the app threw an error. The maintainer has been
            notified. Try refreshing — if it sticks, drop a note to{" "}
            <a href="mailto:cla1re@me.com" style={{ color: "#c4956a" }}>
              cla1re@me.com
            </a>
            .
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "10px 20px",
              border: "1px solid #c4956a",
              background: "transparent",
              color: "#c4956a",
              fontSize: 14,
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
