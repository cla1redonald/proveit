export default function FullBundlePointer() {
  return (
    <p
      className="font-sans text-xs leading-relaxed max-w-md"
      style={{ color: "var(--text-secondary)" }}
    >
      Want the full handoff bundle —{" "}
      <code className="font-mono text-[0.72rem]">discovery.md</code>,{" "}
      <code className="font-mono text-[0.72rem]">brand.md</code>,{" "}
      <code className="font-mono text-[0.72rem]">spec.md</code>,{" "}
      <code className="font-mono text-[0.72rem]">design-brief.md</code>,
      and paste-ready Claude Design prompts? Run <code className="font-mono text-[0.72rem]">/proveit</code>{" "}
      in{" "}
      <a
        href="https://claude.com/claude-code"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        Claude Code
      </a>{" "}
      — same idea, free, full pipeline.
    </p>
  );
}
