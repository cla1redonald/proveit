"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  grantAnalyticsConsent,
  revokeAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/posthog";

function useConsent(): AnalyticsConsent | null {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);

  useEffect(() => {
    const readConsent = () => setConsent(getAnalyticsConsent());
    readConsent();

    window.addEventListener(ANALYTICS_CONSENT_EVENT, readConsent);
    window.addEventListener("storage", readConsent);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, readConsent);
      window.removeEventListener("storage", readConsent);
    };
  }, []);

  return consent;
}

function chooseConsent(next: AnalyticsConsent): void {
  if (next === "granted") {
    grantAnalyticsConsent();
  } else {
    revokeAnalyticsConsent();
  }
}

/** A small, non-blocking banner shown until the visitor makes an analytics choice. */
export function AnalyticsConsentBanner() {
  const consent = useConsent();

  if (consent !== null) return null;

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-[60] border-t p-[var(--space-4)] shadow-[var(--shadow-lg)]"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
      role="dialog"
      aria-label="Analytics choices"
    >
      <div className="mx-auto flex max-w-[960px] flex-col gap-[var(--space-3)] md:flex-row md:items-center md:justify-between md:gap-[var(--space-8)]">
        <p
          className="font-sans"
          style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}
        >
          ProveIt uses optional PostHog analytics to understand which parts of
          the product are useful and to spot errors. It stays off until you
          choose.{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2"
            style={{ color: "var(--text-primary)" }}
          >
            Read the privacy notice.
          </Link>
        </p>
        <div className="flex shrink-0 gap-[var(--space-2)]">
          <button
            type="button"
            onClick={() => chooseConsent("denied")}
            className="outline-btn rounded-[var(--radius-md)] border px-[var(--space-4)] py-[var(--space-2)] font-sans text-xs font-medium uppercase tracking-[0.08em]"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => chooseConsent("granted")}
            className="accent-btn rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--space-2)] font-sans text-xs font-semibold uppercase tracking-[0.08em]"
          >
            Allow analytics
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Control used on the privacy page so consent can be withdrawn or granted later. */
export function AnalyticsConsentControls() {
  const consent = useConsent();

  if (consent === null) {
    return (
      <p className="font-sans text-sm" style={{ color: "var(--text-secondary)" }}>
        Choose an analytics preference using the banner at the bottom of the page.
      </p>
    );
  }

  const granted = consent === "granted";
  return (
    <div className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:items-center sm:justify-between">
      <p className="font-sans text-sm" style={{ color: "var(--text-secondary)" }}>
        Analytics are currently {granted ? "on" : "off"} for this browser.
      </p>
      <button
        type="button"
        onClick={() => chooseConsent(granted ? "denied" : "granted")}
        className={granted
          ? "outline-btn rounded-[var(--radius-md)] border px-[var(--space-4)] py-[var(--space-2)] font-sans text-xs font-semibold uppercase tracking-[0.08em]"
          : "accent-btn rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--space-2)] font-sans text-xs font-semibold uppercase tracking-[0.08em]"}
      >
        {granted ? "Turn analytics off" : "Allow analytics"}
      </button>
    </div>
  );
}
