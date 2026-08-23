import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaxonomyClient } from "./taxonomy.client";
import type { FieldDto, TagDto } from "./types";

/** Creates a TaxonomyClient backed by workspace-scoped Supabase tables. */
export function createSupabaseTaxonomyClient(client: SupabaseClient, workspaceId: string): TaxonomyClient {
  return {
    async listFields() {
      const { data, error } = await client.from("fields").select("id, name, created_at").eq("workspace_id", workspaceId).order("name");
      throwSupabaseError(error, "load fields");
      return (data ?? []).map((field) => ({ id: field.id as string, name: field.name as string, createdAt: field.created_at as number })) satisfies FieldDto[];
    },
    async listTags() {
      const { data, error } = await client.from("tags").select("id, name, parent_tag_id, path, depth, created_at").eq("workspace_id", workspaceId).order("path");
      throwSupabaseError(error, "load tags");
      return (data ?? []).map((tag) => ({ id: tag.id as string, name: tag.name as string, parentTagId: (tag.parent_tag_id as string | null) ?? undefined, path: tag.path as string, depth: tag.depth as number, createdAt: tag.created_at as number })) satisfies TagDto[];
    },
    async deleteField(fieldId) {
      const { count, error: countError } = await client.from("notes").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("field_id", fieldId).is("deleted_at", null);
      throwSupabaseError(countError, "check field usage");
      if ((count ?? 0) > 0) {
        throw new Error("Cannot delete a field that is still used by notes");
      }
      const { error } = await client.from("fields").delete().eq("workspace_id", workspaceId).eq("id", fieldId);
      throwSupabaseError(error, "delete field");
    },
  };
}

/** Throws a contextual error while preserving the Supabase response message for the UI. */
function throwSupabaseError(error: { message: string } | null, operation: string): void {
  if (error) {
    console.error("[zembra] Supabase taxonomy operation failed", { operation, message: error.message });
    throw new Error(`Could not ${operation}: ${error.message}`);
  }
}
