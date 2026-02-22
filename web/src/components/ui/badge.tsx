import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1)] text-xs font-medium tracking-[0.12em] uppercase font-mono",
  {
    variants: {
      variant: {
        default: "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]",
        supported: "bg-[var(--color-supported)] text-[var(--color-supported-fg)]",
        weak: "bg-[var(--color-weak)] text-[var(--color-weak-fg)]",
        contradicted: "bg-[var(--color-contradicted)] text-[var(--color-contradicted-fg)]",
        killSignal: "bg-[var(--color-kill-signal)] text-[var(--color-kill-signal-fg)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
