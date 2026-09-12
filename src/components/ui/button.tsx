// Adapted from shadcn/ui new-york-v4 (MIT); see docs/references/shadcn-ui.md.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap transition-all outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-[var(--color-error)] aria-invalid:ring-[var(--color-error)]  [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        plain: "",
        default:
          "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] hover:bg-[var(--color-accent-hover)]",
        destructive:
          "bg-[var(--color-error)] text-[var(--color-error-contrast)] hover:bg-[var(--color-error)] focus-visible:ring-[var(--color-error)]",
        outline:
          "border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]",
        secondary:
          "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]",
        ghost:
          "hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]",
        link: "text-[var(--color-accent)] underline-offset-4 hover:underline",
      },
      size: {
        content: "",
        default:
          "h-[var(--control-height)] gap-[var(--space-2)] rounded-[var(--radius-control)] px-[var(--space-3)] text-sm font-medium",
        xs: "h-6 gap-1 rounded-[var(--radius-control)] px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[var(--radius-control)] px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-[var(--radius-control)] px-6 has-[>svg]:px-4",
        icon: "size-[var(--icon-hit-size)] rounded-[var(--radius-control)]",
        "icon-xs":
          "size-6 rounded-[var(--radius-control)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
