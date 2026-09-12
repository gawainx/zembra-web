// Adapted from shadcn/ui new-york-v4 (MIT); see docs/references/shadcn-ui.md.
"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { Switch as SwitchPrimitive } from "radix-ui";

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-[var(--switch-height)] data-[size=default]:w-[var(--switch-width)] data-[size=sm]:[--switch-width:1.5rem] data-[size=sm]:[--switch-thumb:0.75rem] data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=checked]:bg-[var(--color-accent)] data-[state=unchecked]:bg-[var(--color-border)]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-[var(--color-control-thumb)] ring-0 transition-transform group-data-[size=default]/switch:size-[var(--switch-thumb)] group-data-[size=sm]/switch:size-3 data-[state=checked]:translate-x-[calc(var(--switch-width)-var(--switch-thumb)-var(--space-1)-1px)] data-[state=unchecked]:translate-x-[calc(var(--space-1)-1px)]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
