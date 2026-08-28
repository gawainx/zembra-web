import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotesClient } from "../notes.client";
import { createSupabaseNotesClient } from "../supabase-notes.client";
import { createSupabaseTaxonomyClient } from "../supabase-taxonomy.client";
import type { TaxonomyClient } from "../taxonomy.client";

let activeNotesClient: NotesClient | undefined;
let activeTaxonomyClient: TaxonomyClient | undefined;

/** Activates Supabase business clients for an RLS-authorized workspace. */
export function activateDataSource(client: SupabaseClient, workspaceId: string): void {
  activeNotesClient = createSupabaseNotesClient(client, workspaceId);
  activeTaxonomyClient = createSupabaseTaxonomyClient(client, workspaceId);
  console.info("[zembra] Activated Supabase data source", {
    workspaceId: workspaceId.slice(0, 8),
  });
}

/** Returns the active Supabase notes client. */
export function getNotesClient(): NotesClient {
  if (!activeNotesClient) {
    throw new Error("No Supabase data source is active; complete the entry flow first");
  }

  return activeNotesClient;
}

/** Returns the active Supabase taxonomy client. */
export function getTaxonomyClient(): TaxonomyClient {
  if (!activeTaxonomyClient) {
    throw new Error("No Supabase data source is active; complete the entry flow first");
  }

  return activeTaxonomyClient;
}
