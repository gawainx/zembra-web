// Adapted from shadcn/ui new-york-v4 (MIT); see docs/references/shadcn-ui.md.
import * as React from "react";
import { cn } from "../../lib/utils";

function NativeSelect({
  className,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"select">, "size"> & { size?: "sm" | "default" }) {
  return (
    <select
      data-slot="native-select"
      data-size={size}
      className={cn(
        "min-w-0 bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[var(--color-accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-accent)]",
        "aria-invalid:border-[var(--color-error)] aria-invalid:ring-[var(--color-error)]",
        className,
      )}
      {...props}
    />
  );
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn(
        "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
        className,
      )}
      {...props}
    />
  );
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn(
        "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
