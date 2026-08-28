import type { ReactNode } from "react";

/** Preserves home children when the Supabase build has no synchronization controls. */
export function SourceHomeControlsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** Omits Backend-only toolbar actions from the Supabase build. */
export function SourceToolbarActions() {
  return null;
}

/** Omits Backend-only synchronization feedback from the Supabase build. */
export function SourceStatusFeedback() {
  return null;
}
