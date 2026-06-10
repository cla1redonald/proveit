"use client";

import { useState, useCallback } from "react";
import type { ValidationSession } from "@/types";

interface FullBundlePointerProps {
  session?: ValidationSession;
}

type ChosenOption = "one_off" | "subscription";

const OPTION_LABELS: Record<ChosenOption, string> = {
  one_off: "£4.99 (one-off)",
  subscription: "£9.99/mo",
};

export default function FullBundlePointer({ session }: FullBundlePointerProps) {
  // WoZ modal state — used as a fallback when Stripe is not configured (503)
  const [modalOption, setModalOption] = useState<ChosenOption | null>(null);
  const [email, setEmail] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const closeModal = useCallback(() => {
    if (submitting) return;
    setModalOption(null);
    setError(null);
    if (submitted) {
      // Reset after a successful submission has been acknowledged.
      setEmail("");
      setIntendedUse("");
      setSubmitted(false);
    }
  }, [submitting, submitted]);

  // WoZ modal submit handler (fallback path when Stripe not configured)
  const handleWozSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!modalOption) return;
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/woz-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            chosenOption: modalOption,
            intendedUse,
            ideaSummary: session?.ideaSummary ?? "",
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Couldn't submit. Please try again.");
        }
        setSubmitted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't submit. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [modalOption, email, intendedUse, session?.ideaSummary]
  );

  // One-off purchase handler: POST /api/stripe/checkout → redirect to Stripe Checkout.
  // Falls back to the WoZ modal on 503 (Stripe not yet configured).
  const handleOneOffClick = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveitSessionId: session?.id,
          ideaSummary: session?.ideaSummary ?? "",
          transcript: session?.messages ?? [],
        }),
      });

      if (res.status === 503) {
        // Stripe not configured yet — fall back to WoZ email-capture modal
        setModalOption("one_off");
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Couldn't start checkout. Please try again.");
      }

      const data = (await res.json()) as { url?: string };
      if (!data.url) {
        throw new Error("No checkout URL returned. Please try again.");
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [session]);

  return (
    <div className="flex flex-col gap-[var(--space-4)] max-w-md">
      {error && !modalOption && (
        <p
          role="alert"
          className="font-sans text-sm"
          style={{ color: "var(--color-contradicted-fg)" }}
        >
          {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-[var(--space-3)]">
        <button
          type="button"
          disabled={submitting}
          onClick={handleOneOffClick}
          className="outline-btn inline-flex items-center justify-center px-[var(--space-5)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-medium border disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Loading…" : "Get the bundle — £4.99 (one-off)"}
        </button>
        {/* Subscription button deferred to #37 — out of scope for v1.
            Keeping the markup so the WoZ modal still handles subscription
            intents via the fallback path if needed. */}
        {/* <button
          type="button"
          onClick={() => setModalOption("subscription")}
          className="outline-btn inline-flex items-center justify-center px-[var(--space-5)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-medium border"
        >
          Subscribe — £9.99/mo
        </button> */}
      </div>

      <p
        className="font-sans text-xs leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        Prefer the free path? Run <code className="font-mono text-[0.72rem]">/proveit</code> in{" "}
        <a
          href="https://claude.com/claude-code"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Claude Code
        </a>{" "}
        — same idea, full pipeline including{" "}
        <code className="font-mono text-[0.72rem]">discovery.md</code>,{" "}
        <code className="font-mono text-[0.72rem]">brand.md</code>,{" "}
        <code className="font-mono text-[0.72rem]">spec.md</code>,{" "}
        <code className="font-mono text-[0.72rem]">design-brief.md</code>, and paste-ready Claude
        Design prompts.
      </p>

      {/* WoZ modal — renders when Stripe returns 503 (not configured yet),
          preserving the existing email-capture fallback path. */}
      {modalOption !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="woz-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-[var(--space-4)]"
          style={{ background: "rgba(17, 26, 36, 0.5)" }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[var(--radius-lg)] p-[var(--space-6)]"
            style={{ background: "var(--surface, #ffffff)", border: "1px solid var(--border, #e0d9cf)" }}
          >
            {submitted ? (
              <div className="flex flex-col gap-[var(--space-4)]">
                <h2
                  id="woz-modal-title"
                  className="font-display text-lg"
                  style={{ color: "var(--heading, #111a24)" }}
                >
                  Thanks — Claire will personally email you the bundle within 4 hours.
                </h2>
                <p className="font-sans text-sm" style={{ color: "var(--text-secondary)" }}>
                  Check <strong>{email}</strong> (and the spam folder, just in case).
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="outline-btn self-start inline-flex items-center justify-center px-[var(--space-5)] py-[var(--space-2)] rounded-[var(--radius-md)] font-sans text-sm font-medium border"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleWozSubmit} className="flex flex-col gap-[var(--space-4)]">
                <h2
                  id="woz-modal-title"
                  className="font-display text-lg"
                  style={{ color: "var(--heading, #111a24)" }}
                >
                  Bundle — {OPTION_LABELS[modalOption]}
                </h2>
                <p className="font-sans text-sm" style={{ color: "var(--text-secondary)" }}>
                  Drop your email and one line on what you&apos;ll use this for. Claire personally
                  emails the bundle within 4 hours — no automation, no card capture.
                </p>

                <label className="flex flex-col gap-[var(--space-1)]">
                  <span className="font-sans text-xs uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
                    Email
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-md)] font-sans text-sm border"
                    style={{ background: "var(--surface, #ffffff)", borderColor: "var(--border, #e0d9cf)" }}
                  />
                </label>

                <label className="flex flex-col gap-[var(--space-1)]">
                  <span className="font-sans text-xs uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
                    What will you use this for?
                  </span>
                  <input
                    type="text"
                    value={intendedUse}
                    onChange={(e) => setIntendedUse(e.target.value)}
                    maxLength={500}
                    placeholder="e.g. pitching an internal product idea at work"
                    className="w-full px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-md)] font-sans text-sm border"
                    style={{ background: "var(--surface, #ffffff)", borderColor: "var(--border, #e0d9cf)" }}
                  />
                </label>

                {error && (
                  <p
                    role="alert"
                    className="font-sans text-sm"
                    style={{ color: "var(--color-contradicted-fg)" }}
                  >
                    {error}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-[var(--space-3)]">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="outline-btn inline-flex items-center justify-center px-[var(--space-5)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-medium border disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Sending..." : "Send me the bundle"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="inline-flex items-center justify-center px-[var(--space-5)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm disabled:opacity-40"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
