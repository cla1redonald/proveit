import Link from "next/link";
import ChatInterface from "@/components/validate/ChatInterface";

export default function ValidatePage() {
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
          style={{ maxWidth: "960px" }}
        >
          <Link
            href="/"
            className="font-mono font-medium"
            style={{
              fontSize: "var(--text-xl)",
              color: "var(--text-primary)",
              textDecoration: "none",
            }}
          >
            ProveIt
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <ChatInterface />
      </main>
    </div>
  );
}
