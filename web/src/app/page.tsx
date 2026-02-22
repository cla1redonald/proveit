import ResumeSessionBanner from "@/components/home/ResumeSessionBanner";
import Link from "next/link";

const HOW_IT_WORKS_STEPS = [
  {
    num: "01",
    title: "Paste your idea",
    body: "One textarea. No setup.",
  },
  {
    num: "02",
    title: "ProveIt researches",
    body: "Competitors, market evidence, viability signals.",
  },
  {
    num: "03",
    title: "You decide",
    body: "Evidence on the table. Go, kill, or pivot.",
  },
];

function HowItWorks() {
  return (
    <div className="space-y-[var(--space-8)]">
      {HOW_IT_WORKS_STEPS.map((step) => (
        <div key={step.num} className="flex gap-[var(--space-4)]">
          <span
            className="font-mono font-medium shrink-0 mt-0.5"
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
            }}
          >
            {step.num}
          </span>
          <div>
            <p
              className="font-mono font-medium mb-[var(--space-1)]"
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-primary)",
              }}
            >
              {step.title}
            </p>
            <p
              className="font-mono"
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
              }}
            >
              {step.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
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
          <span
            className="font-mono font-medium"
            style={{ fontSize: "var(--text-xl)", color: "var(--text-primary)" }}
          >
            ProveIt
          </span>
        </div>
      </header>

      {/* Main content */}
      <main
        className="flex-1 mx-auto w-full px-[var(--space-4)] md:px-[var(--space-8)] py-[var(--space-10)] md:py-[var(--space-16)]"
        style={{ maxWidth: "960px" }}
      >
        {/* Resume session banner — client island */}
        <ResumeSessionBanner />

        {/* Two-column layout on desktop */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-[var(--space-16)]">

          {/* Left column: hero + how it works */}
          <div className="flex-1 mb-[var(--space-10)] lg:mb-0">
            <p className="section-label mb-[var(--space-6)]" aria-hidden="true">
              PRODUCT VALIDATION TOOL
            </p>

            <h1
              className="font-mono font-medium mb-[var(--space-4)]"
              style={{
                fontSize: "var(--text-3xl)",
                lineHeight: "var(--leading-tight)",
                color: "var(--text-primary)",
              }}
            >
              ProveIt first,<br />
              then build it.
            </h1>

            <p
              className="font-mono mb-[var(--space-8)]"
              style={{
                fontSize: "var(--text-base)",
                lineHeight: "var(--leading-normal)",
                color: "var(--text-secondary)",
              }}
            >
              Products don&apos;t fail at launch. They fail at the idea,
              when nobody checked the odds first.
            </p>

            {/* How it works — desktop only in left column */}
            <div className="hidden lg:block">
              <p className="section-label mb-[var(--space-6)]">HOW IT WORKS</p>
              <HowItWorks />
            </div>
          </div>

          {/* Right column: entry point cards */}
          <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-[var(--space-4)]">
            {/* Fast Check card */}
            <div
              className="rounded-[var(--radius-lg)] border p-[var(--space-5)]"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                borderLeftWidth: "3px",
                borderLeftColor: "var(--color-accent)",
              }}
            >
              <p className="section-label mb-[var(--space-3)]">FAST CHECK</p>
              <p
                className="font-mono mb-[var(--space-1)]"
                style={{
                  fontSize: "var(--text-base)",
                  color: "var(--text-secondary)",
                }}
              >
                3 assumptions. 15 minutes.
              </p>
              <p
                className="font-mono mb-[var(--space-5)]"
                style={{
                  fontSize: "var(--text-base)",
                  color: "var(--text-secondary)",
                }}
              >
                No back-and-forth.
              </p>
              <Link
                href="/fast"
                className="accent-btn inline-flex w-full lg:w-auto items-center justify-center px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-semibold uppercase tracking-[0.08em]"
              >
                RUN FAST CHECK
              </Link>
            </div>

            {/* Full Validation card */}
            <div
              className="rounded-[var(--radius-lg)] border p-[var(--space-5)]"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
              }}
            >
              <p className="section-label mb-[var(--space-3)]">FULL VALIDATION</p>
              <p
                className="font-mono mb-[var(--space-1)]"
                style={{
                  fontSize: "var(--text-base)",
                  color: "var(--text-secondary)",
                }}
              >
                Desirability, viability, feasibility.
              </p>
              <p
                className="font-mono mb-[var(--space-5)]"
                style={{
                  fontSize: "var(--text-base)",
                  color: "var(--text-secondary)",
                }}
              >
                With evidence.
              </p>
              <Link
                href="/validate"
                className="outline-btn inline-flex w-full lg:w-auto items-center justify-center px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] font-sans text-sm font-medium uppercase tracking-[0.08em] border"
              >
                START FULL VALIDATION
              </Link>
            </div>
          </div>
        </div>

        {/* How it works — mobile only */}
        <div className="lg:hidden mt-[var(--space-12)]">
          <p className="section-label mb-[var(--space-6)]">HOW IT WORKS</p>
          <HowItWorks />
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-[var(--space-8)] text-center">
        <p
          className="font-mono"
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-muted)",
          }}
        >
          ProveIt — Evidence-based product validation.
        </p>
      </footer>
    </div>
  );
}
