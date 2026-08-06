"use client";

import { useState } from "react";
import Link from "next/link";
import { captureEvent } from "@/lib/posthog";

interface EmailCaptureFormProps {
  /** The 503 reason — shapes the framing copy */
  reason: "global_cap" | "per_ip_cap";
  /** First ~200 chars of the user's idea, for context in the captured entry */
  ideaExcerpt?: string;
  /** Called when the user successfully submits (so the caller can hide the form / show a thanks state at a higher level if desired) */
  onSubmitted?: () => void;
}

/**
 * Inline form shown when /api/fast or /api/chat returns 503. Captures email
 * (+ optional one-line note) so Claire can follow up when there's more
 * capacity. Posts to /api/waitlist, which writes to a daily Upstash list.
 *
 * The form tells users who receives the email and links to the privacy notice.
 */
export default function EmailCaptureForm({
  reason,
  ideaExcerpt,
  onSubmitted,
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting" || status === "success") return;

    setStatus("submitting");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ideaExcerpt: ideaExcerpt ? `${ideaExcerpt}${note ? ` — ${note}` : ""}` : note || undefined,
          reason,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Something went wrong" }));
        setErrorMsg(body.error ?? "Something went wrong");
        setStatus("error");
        return;
      }

      setStatus("success");
      captureEvent("waitlist_submitted", { reason });
      onSubmitted?.();
    } catch {
      setErrorMsg("Couldn't reach the server. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        className="rounded-[var(--radius-lg)] border p-[var(--space-4)] mt-[var(--space-4)]"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
        role="status"
      >
        <p
          className="font-sans"
          style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}
        >
          Thanks — I&apos;ll be in touch when there&apos;s more capacity, or sooner if you mentioned something I should know.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-lg)] border p-[var(--space-4)] mt-[var(--space-4)]"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <p
        className="font-sans mb-[var(--space-3)]"
        style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}
      >
        Want more access? Drop your email and I&apos;ll get in touch when there&apos;s more capacity. Goes straight to me (Claire), nothing automated.{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy notice
        </Link>
      </p>

      <label
        htmlFor="waitlist-email"
        className="sr-only"
      >
        Email address
      </label>
      <input
        id="waitlist-email"
        type="email"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        placeholder="you@example.com"
        autoComplete="email"
        className="w-full rounded-[var(--radius-md)] border font-sans mb-[var(--space-2)]"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
          color: "var(--text-primary)",
          fontSize: "var(--text-sm)",
          padding: "var(--space-2) var(--space-3)",
        }}
        aria-invalid={status === "error" ? "true" : "false"}
        disabled={status === "submitting"}
      />

      <label
        htmlFor="waitlist-note"
        className="sr-only"
      >
        Optional note
      </label>
      <input
        id="waitlist-note"
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="One line about what brought you here (optional)"
        maxLength={140}
        className="w-full rounded-[var(--radius-md)] border font-sans mb-[var(--space-3)]"
        style={{
          backgroundColor: "var(--bg-base)",
          borderColor: "var(--border-default)",
          color: "var(--text-primary)",
          fontSize: "var(--text-sm)",
          padding: "var(--space-2) var(--space-3)",
        }}
        disabled={status === "submitting"}
      />

      <button
        type="submit"
        disabled={status === "submitting" || !email}
        className="accent-btn inline-flex items-center justify-center px-[var(--space-5)] py-[var(--space-2)] rounded-[var(--radius-md)] font-sans font-semibold uppercase tracking-[0.08em] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ fontSize: "var(--text-xs)" }}
      >
        {status === "submitting" ? "Sending…" : "Let me know"}
      </button>

      {errorMsg && (
        <p
          className="font-sans mt-[var(--space-2)]"
          style={{ fontSize: "var(--text-xs)", color: "var(--color-contradicted-fg)" }}
          role="alert"
        >
          {errorMsg}
        </p>
      )}
    </form>
  );
}
