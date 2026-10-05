import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotesClient } from "./notes.client";
import type {
  CreateNoteInput,
  DailyNoteCount,
  NoteDto,
  NoteLinkInput,
  NotesQuery,
  RecentNotesQuery,
  UpdateNoteInput,
} from "./types";
import { resolveRequiredFieldName } from "./defaultField";

interface SupabaseNoteRow {
  id: string;
  content: string;
  role: string;
  field_id: string | null;
  created_at: number;
  updated_at: number;
  archived_at: number | null;
}

interface SupabaseTagRow {
  id: string;
  name: string;
  parent_tag_id: string | null;
  path: string;
  depth: number;
  created_at: number;
}

interface SupabaseNoteTagRow {
  note_id: string;
  tag_id: string;
}

/** Creates a NotesClient that maps the shared Postgres schema into existing UI DTOs. */
export function createSupabaseNotesClient(
  client: SupabaseClient,
  workspaceId: string,
): NotesClient {
  return {
    async getRandomNotes() {
      console.info("[zembra] Loading random notes", { workspaceId });
      const { data, error } = await client.rpc("get_random_notes", { p_workspace_id: workspaceId });
      throwSupabaseError(error, "load random notes");
      if (!data || !Number.isSafeInteger(data.eligible_count) || data.eligible_count < 0 || !Array.isArray(data.notes)
        || data.notes.length !== (data.eligible_count > 20 ? 5 : 0)
        || new Set(data.notes.map((note: SupabaseNoteRow) => note.id)).size !== data.notes.length
        || data.notes.some((note: SupabaseNoteRow & { tags: string[] }) => !note || typeof note.id !== "string" || typeof note.content !== "string" || note.archived_at != null || !Array.isArray(note.tags))) {
        console.warn("[zembra] Invalid random notes response", { workspaceId });
        throw new Error("Invalid random notes response");
      }
      console.info("[zembra] Loaded random notes", { workspaceId, count: data.notes.length });
      return { eligibleCount: data.eligible_count as number, notes: data.notes.map((note: SupabaseNoteRow & { tags: string[] }) => mapNoteRow(note, note.tags)) };
    },
    async countArchivedNotes() {
      console.info("[zembra] Loading archive count", { workspaceId });
      const { count, error } = await client.from("notes").select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId).is("deleted_at", null).not("archived_at", "is", null);
      throwSupabaseError(error, "load archive count");
      if (count == null) throw new Error("Archive count was not returned");
      console.info("[zembra] Loaded archive count", { workspaceId, count });
      return count;
    },
    async listArchivedNotes(cursor) {
      console.info("[zembra] Loading archive page", { workspaceId, hasCursor: Boolean(cursor) });
      let request = client.from("notes")
        .select("id, content, role, field_id, created_at, updated_at, archived_at")
        .eq("workspace_id", workspaceId).is("deleted_at", null).not("archived_at", "is", null)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(200);
      if (cursor) {
        request = request.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${JSON.stringify(cursor.id)})`);
      }
      const { data, error } = await request;
      throwSupabaseError(error, "load archive page");
      const rows = (data ?? []) as SupabaseNoteRow[];
      const last = rows.at(-1);
      if (last && cursor && last.id === cursor.id && last.created_at === cursor.createdAt) {
        throw new Error("Archive cursor did not advance");
      }
      const notes = await attachTags(client, workspaceId, rows);
      console.info("[zembra] Loaded archive page", { workspaceId, count: notes.length });
      return { notes, nextCursor: last ? { id: last.id, createdAt: last.created_at } : undefined };
    },
    async setNoteArchived(noteId, archived) {
      console.info("[zembra] Updating note archive state", { workspaceId, noteId, archived });
      const { data: existing, error: readError } = await client.from("notes")
        .select("created_at, updated_at").eq("workspace_id", workspaceId).eq("id", noteId)
        .is("deleted_at", null).single();
      throwSupabaseError(readError, "read archive target");
      if (!existing) throw new Error("Archive target was not found");
      const now = Math.max(currentUnixSeconds(), existing.created_at, existing.updated_at);
      const { data, error } = await client.from("notes")
        .update({ archived_at: archived ? now : null, updated_at: now })
        .eq("workspace_id", workspaceId).eq("id", noteId).is("deleted_at", null)
        .select("id, archived_at, updated_at").single();
      throwSupabaseError(error, "set note archive state");
      if (!data) throw new Error("Archive update did not affect a note");
      console.info("[zembra] Updated note archive state", { workspaceId, noteId, archived });
      return { id: data.id, archivedAt: data.archived_at, updatedAt: data.updated_at };
    },
    async listRecentNotes(query = {}) {
      let request = client
        .from("notes")
        .select("id, content, role, field_id, created_at, updated_at, archived_at")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(query.limit ?? 50);

      if (query.role) {
        request = request.eq("role", query.role);
      }

      const { data, error } = await request;
      throwSupabaseError(error, "load recent notes");
      return attachTags(client, workspaceId, (data ?? []) as SupabaseNoteRow[]);
    },
    async listDailyNoteCounts(dayCount) {
      const { data, error } = await client
        .from("notes")
        .select("created_at")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .is("archived_at", null);
      throwSupabaseError(error, "load daily note counts");
      return createDailyCounts((data ?? []) as Array<{ created_at: number }>, dayCount);
    },
    async listNotes(query) {
      const notes = await listAllNotes(client, workspaceId);
      return filterNotes(await attachTags(client, workspaceId, notes), query);
    },
    async getNote(noteRef) {
      const { data, error } = await client
        .from("notes")
        .select("id, content, role, field_id, created_at, updated_at, archived_at")
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .ilike("id", `${noteRef}%`)
        .limit(2);
      throwSupabaseError(error, "load note");

      if (!data || data.length !== 1) {
        throw new Error("Note was not found or the reference is ambiguous");
      }

      return (await attachTags(client, workspaceId, data as SupabaseNoteRow[]))[0];
    },
    async createNote(input) {
      const now = currentUnixSeconds();
      const noteId = crypto.randomUUID();
      const fieldId = await ensureField(client, workspaceId, input.field, now);
      const { error } = await client.from("notes").insert({
        id: noteId,
        workspace_id: workspaceId,
        content: input.content,
        role: input.role ?? "Human",
        field_id: fieldId,
        created_at: now,
        updated_at: now,
        conflict_status: "none",
      });
      throwSupabaseError(error, "create note");
      await replaceNoteTags(client, workspaceId, noteId, input.tags ?? [], now);
      await replaceNoteLinks(client, workspaceId, noteId, input.links ?? [], now);
      await createRevision(client, workspaceId, noteId, input.content, input.deviceId, now);
      return (await getNoteById(client, workspaceId, noteId));
    },
    async updateNote(noteRef, input) {
      const existing = await resolveNoteRow(client, workspaceId, noteRef);
      const now = currentUnixSeconds();
      const fieldId =
        input.field === undefined && existing.field_id
          ? existing.field_id
          : await ensureField(client, workspaceId, input.field, now);
      const { error } = await client
        .from("notes")
        .update({ content: input.content, field_id: fieldId, updated_at: now })
        .eq("workspace_id", workspaceId)
        .eq("id", existing.id);
      throwSupabaseError(error, "update note");

      if (input.tags) {
        await replaceNoteTags(client, workspaceId, existing.id, input.tags, now);
      }
      if (input.links) {
        await replaceNoteLinks(client, workspaceId, existing.id, input.links, now);
      }
      await createRevision(client, workspaceId, existing.id, input.content, input.deviceId, now);
      return getNoteById(client, workspaceId, existing.id);
    },
    async deleteNote(noteRef) {
      const note = await resolveNoteRow(client, workspaceId, noteRef);
      const now = currentUnixSeconds();
      const { error } = await client
        .from("notes")
        .update({ deleted_at: now, updated_at: now })
        .eq("workspace_id", workspaceId)
        .eq("id", note.id);
      throwSupabaseError(error, "delete note");
    },
  };
}

/** Loads all non-deleted notes in one workspace for client-side UI filtering. */
async function listAllNotes(client: SupabaseClient, workspaceId: string): Promise<SupabaseNoteRow[]> {
  const { data, error } = await client
    .from("notes")
    .select("id, content, role, field_id, created_at, updated_at, archived_at")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  throwSupabaseError(error, "load notes");
  return (data ?? []) as SupabaseNoteRow[];
}

/** Resolves a complete or unique prefix note reference into one stored note row. */
async function resolveNoteRow(client: SupabaseClient, workspaceId: string, noteRef: string): Promise<SupabaseNoteRow> {
  const { data, error } = await client
    .from("notes")
    .select("id, content, role, field_id, created_at, updated_at, archived_at")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .ilike("id", `${noteRef}%`)
    .limit(2);
  throwSupabaseError(error, "resolve note");

  if (!data || data.length !== 1) {
    throw new Error("Note was not found or the reference is ambiguous");
  }

  return data[0] as SupabaseNoteRow;
}

/** Loads one complete note and resolves its tag paths for the UI DTO. */
async function getNoteById(client: SupabaseClient, workspaceId: string, noteId: string): Promise<NoteDto> {
  return (await attachTags(client, workspaceId, [await resolveNoteRow(client, workspaceId, noteId)]))[0];
}

/** Loads complete tag associations even when the service caps each response. */
async function attachTags(client: SupabaseClient, workspaceId: string, notes: SupabaseNoteRow[]): Promise<NoteDto[]> {
  if (!notes.length) return [];
  const paths = new Map<string, string>();
  for (let offset = 0;;) {
    const { data, error } = await client.from("tags").select("id, path")
      .eq("workspace_id", workspaceId).order("id").range(offset, offset + 199);
    throwSupabaseError(error, "load tag paths");
    if (!data?.length) break;
    for (const row of data) paths.set(row.id, row.path);
    offset += data.length;
  }
  const byNote = new Map<string, string[]>();
  for (let start = 0; start < notes.length; start += 100) {
    const ids = notes.slice(start, start + 100).map((note) => note.id);
    for (let offset = 0;;) {
      const { data, error } = await client.from("note_tags").select("note_id, tag_id")
        .eq("workspace_id", workspaceId).in("note_id", ids)
        .order("note_id").order("tag_id").range(offset, offset + 199);
      throwSupabaseError(error, "load note tags");
      if (!data?.length) break;
      for (const row of data) {
        const path = paths.get(row.tag_id);
        if (path) byNote.set(row.note_id, [...(byNote.get(row.note_id) ?? []), path]);
      }
      offset += data.length;
    }
  }
  return notes.map((note) => mapNoteRow(note, byNote.get(note.id) ?? []));
}

/** Maps a Postgres note row into the provider-neutral UI DTO. */
function mapNoteRow(note: SupabaseNoteRow, tags: string[]): NoteDto {
  return { id: note.id, content: note.content, role: note.role, fieldId: note.field_id ?? undefined, createdAt: note.created_at, updatedAt: note.updated_at, archivedAt: note.archived_at, tags };
}

/** Creates or reuses the required field named by an editor input. */
async function ensureField(client: SupabaseClient, workspaceId: string, fieldName: string | null | undefined, now: number): Promise<string> {
  const normalizedName = resolveRequiredFieldName(fieldName);
  const { data, error } = await client.from("fields").select("id").eq("workspace_id", workspaceId).eq("name", normalizedName).maybeSingle();
  throwSupabaseError(error, "look up field");
  if (data) {
    return data.id as string;
  }
  const id = crypto.randomUUID();
  const { error: insertError } = await client.from("fields").insert({ id, workspace_id: workspaceId, name: normalizedName, created_at: now });
  if (insertError && isUniqueConstraintError(insertError)) {
    const { data: existingField, error: retryError } = await client.from("fields").select("id").eq("workspace_id", workspaceId).eq("name", normalizedName).maybeSingle();
    throwSupabaseError(retryError, "recheck field after concurrent creation");
    if (existingField) {
      return existingField.id as string;
    }
  }
  throwSupabaseError(insertError, "create field");
  return id;
}

/** Checks whether a failed insert lost the field-name uniqueness race. */
function isUniqueConstraintError(error: { code?: string }): boolean {
  return error.code === "23505";
}

/** Replaces all tag associations for a note while ensuring the selected hierarchy paths exist. */
async function replaceNoteTags(client: SupabaseClient, workspaceId: string, noteId: string, tagPaths: string[], now: number): Promise<void> {
  const { error: deleteError } = await client.from("note_tags").delete().eq("workspace_id", workspaceId).eq("note_id", noteId);
  throwSupabaseError(deleteError, "replace note tags");
  const tagIds = await Promise.all([...new Set(tagPaths.map((path) => path.trim()).filter(Boolean))].map((path) => ensureTagPath(client, workspaceId, path, now)));
  if (tagIds.length === 0) {
    return;
  }
  const { error: insertError } = await client.from("note_tags").insert(tagIds.map((tagId) => ({ workspace_id: workspaceId, note_id: noteId, tag_id: tagId, created_at: now })));
  throwSupabaseError(insertError, "save note tags");
}

/** Creates every missing segment in one hierarchical tag path and returns its leaf identifier. */
async function ensureTagPath(client: SupabaseClient, workspaceId: string, path: string, now: number): Promise<string> {
  const segments = path.split("/").map((segment) => segment.trim()).filter(Boolean);
  let parentTagId: string | null = null;
  let currentPath = "";
  for (const [index, segment] of segments.entries()) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    const { data, error } = await client.from("tags").select("id").eq("workspace_id", workspaceId).eq("path", currentPath).maybeSingle();
    throwSupabaseError(error, "look up tag");
    if (data) {
      parentTagId = data.id as string;
      continue;
    }
    const id = crypto.randomUUID();
    const { error: insertError } = await client.from("tags").insert({ id, workspace_id: workspaceId, name: segment, parent_tag_id: parentTagId, path: currentPath, depth: index, created_at: now });
    throwSupabaseError(insertError, "create tag");
    parentTagId = id;
  }
  if (!parentTagId) {
    throw new Error("Tag path must include at least one segment");
  }
  return parentTagId;
}

/** Replaces a note's outgoing links with parsed editor references. */
async function replaceNoteLinks(client: SupabaseClient, workspaceId: string, noteId: string, links: NoteLinkInput[], now: number): Promise<void> {
  const { error: deleteError } = await client.from("note_links").delete().eq("workspace_id", workspaceId).eq("source_note_id", noteId);
  throwSupabaseError(deleteError, "replace note links");
  const validLinks = links.filter((link) => link.targetNoteRef !== noteId);
  if (validLinks.length === 0) {
    return;
  }
  const { error: insertError } = await client.from("note_links").insert(validLinks.map((link) => ({ id: crypto.randomUUID(), workspace_id: workspaceId, source_note_id: noteId, target_note_id: link.targetNoteRef, anchor_text: link.anchorText ?? null, position: link.position ?? null, created_at: now })));
  throwSupabaseError(insertError, "save note links");
}

/** Adds a content snapshot and points the note at that latest revision. */
async function createRevision(client: SupabaseClient, workspaceId: string, noteId: string, content: string, deviceId: string | undefined, now: number): Promise<void> {
  const revisionId = crypto.randomUUID();
  const { error } = await client.from("note_revisions").insert({ id: revisionId, workspace_id: workspaceId, note_id: noteId, content, device_id: deviceId ?? null, created_at: now });
  throwSupabaseError(error, "create note revision");
  const { error: noteError } = await client.from("notes").update({ current_revision_id: revisionId }).eq("workspace_id", workspaceId).eq("id", noteId);
  throwSupabaseError(noteError, "update note revision");
}

/** Builds a requested-length heatmap from stored Unix timestamps. */
function createDailyCounts(rows: Array<{ created_at: number }>, dayCount: number): DailyNoteCount[] {
  const today = new Date();
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const date = new Date(row.created_at * 1000).toISOString().slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  });
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (dayCount - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: counts.get(key) ?? 0 };
  });
}

/** Applies existing UI filters after loading provider-neutral note DTOs. */
function filterNotes(notes: NoteDto[], query: NotesQuery): NoteDto[] {
  return notes.filter((note) => (!query.keyword || note.content.includes(query.keyword)) && (!query.tag || note.tags.includes(query.tag)) && (!query.fieldId || note.fieldId === query.fieldId));
}

/** Returns Unix seconds for schema timestamps. */
function currentUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Throws a contextual error while preventing opaque Supabase failures from being ignored. */
function throwSupabaseError(error: { message: string } | null, operation: string): void {
  if (error) {
    console.error("[zembra] Supabase operation failed", { operation, message: error.message });
    throw new Error(`Could not ${operation}: ${error.message}`);
  }
}
