import Link from "next/link";
import FastPageContent from "@/components/fast/FastPageContent";

export default function FastPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: "var(--bg-base)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          className="mx-auto px-[var(--space-4)] md:px-[var(--space-8)] h-14 md:h-16 flex items-center"
          style={{ maxWidth: "860px" }}
        >
          <Link
            href="/"
            className="font-display"
            style={{
              fontSize: "var(--text-2xl)",
              color: "var(--text-primary)",
              textDecoration: "none",
            }}
          >
            ProveIt
          </Link>
        </div>
      </header>

      <main
        className="flex-1 mx-auto w-full px-[var(--space-4)] md:px-[var(--space-8)] py-[var(--space-8)]"
        style={{ maxWidth: "720px" }}
      >
        <FastPageContent />
      </main>
    </div>
  );
}
