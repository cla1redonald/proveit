"use client";

export default function StreamingIndicator() {
  return (
    <div
      className="flex items-center gap-[var(--space-3)] py-[var(--space-4)]"
      aria-busy="true"
      role="status"
      aria-label="Loading"
    >
      <span className="section-label">IDENTIFYING ASSUMPTIONS</span>
      <div className="search-dots flex gap-1">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
