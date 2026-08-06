"use client";

import { AnalyticsConsentBanner } from "@/components/AnalyticsConsent";

/**
 * Mounts the consent banner on every page. PostHog starts only after the
 * visitor opts in; the consent component owns the browser-only initialisation.
 */
export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <AnalyticsConsentBanner />
    </>
  );
}
