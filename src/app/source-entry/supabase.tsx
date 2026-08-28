import type { ReactNode } from "react";
import { SupabaseEntry } from "../SupabaseEntry";

/** Renders the Supabase Direct-only application entry. */
export function SourceEntry({ children }: { children: ReactNode }) {
  return <SupabaseEntry>{children}</SupabaseEntry>;
}
