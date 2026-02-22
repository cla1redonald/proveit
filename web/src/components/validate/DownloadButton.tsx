"use client";

import { useState, useCallback } from "react";
import { generateDiscoveryMarkdown } from "@/lib/markdown";
import type { ValidationSession } from "@/types";

interface DownloadButtonProps {
  session: ValidationSession;
}

export default function DownloadButton({ session }: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = useCallback(() => {
    setIsGenerating(true);
    try {
      const markdown = generateDiscoveryMarkdown(session);
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);

      const date = new Date().toISOString().split("T")[0];
      const slug = session.ideaSummary
        .toLowerCase()
        .split(/\s+/)
        .slice(0, 4)
        .join("-")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 40);
      const filename = `proveit-${slug}-${date}.md`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Could show a toast here — keeping simple for MVP
    } finally {
      setIsGenerating(false);
    }
  }, [session]);

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="outline-btn inline-flex items-center justify-center px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-medium uppercase tracking-[0.08em] border disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isGenerating ? "Generating..." : "DOWNLOAD SUMMARY"}
    </button>
  );
}
