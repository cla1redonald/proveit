import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-accent)] text-[var(--text-primary)] hover:bg-[var(--color-accent-hover)] rounded-[var(--radius-md)] uppercase tracking-[0.08em] font-semibold",
        destructive: "bg-[var(--color-contradicted)] text-[var(--color-contradicted-fg)] hover:opacity-90 rounded-[var(--radius-md)]",
        outline: "border border-[var(--border-default)] bg-transparent hover:bg-[var(--bg-surface)] rounded-[var(--radius-md)]",
        secondary: "bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[var(--radius-md)]",
        ghost: "hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)]",
        link: "text-[var(--color-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "px-[var(--space-6)] py-[var(--space-3)]",
        sm: "px-[var(--space-4)] py-[var(--space-2)] text-xs",
        lg: "px-[var(--space-8)] py-[var(--space-4)]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
