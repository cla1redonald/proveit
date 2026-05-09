"use client";

import { useState, useCallback } from "react";
import { generateDiscoveryMarkdown } from "@/lib/markdown";
import type { ValidationSession } from "@/types";

interface DownloadButtonProps {
  session: ValidationSession;
}

export default function DownloadButton({ session }: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(() => {
    setIsGenerating(true);
    setError(null);
    try {
      const markdown = generateDiscoveryMarkdown(session);
      const blob = new Blob([markdown], { type: "text/plain;charset=utf-8" });
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
      // Defer revoke so the browser has time to initiate the download
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Couldn't generate the file. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [session]);

  return (
    <div className="flex flex-col items-start gap-[var(--space-2)]">
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="outline-btn inline-flex items-center justify-center px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-medium uppercase tracking-[0.08em] border disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isGenerating ? "Generating..." : "DOWNLOAD SUMMARY"}
      </button>
      {error && (
        <p
          className="font-sans text-sm"
          style={{ color: "var(--color-contradicted-fg)" }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
