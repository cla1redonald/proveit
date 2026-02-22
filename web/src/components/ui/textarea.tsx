import * as React from "react";
import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-4)] py-[var(--space-4)] font-mono text-[var(--text-base)] text-[var(--text-primary)] leading-[var(--leading-relaxed)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:border-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-50 resize-vertical",
          "md:min-h-[160px]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
