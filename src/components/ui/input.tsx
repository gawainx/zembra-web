// Adapted from shadcn/ui new-york-v4 (MIT); see docs/references/shadcn-ui.md.
import * as React from "react";
import { cn } from "../../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "min-w-0 bg-transparent outline-none placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[var(--color-accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-accent)]",
        "aria-invalid:border-[var(--color-error)] aria-invalid:ring-[var(--color-error)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
