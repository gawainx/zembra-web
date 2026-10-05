import {
  resolveBackendBaseUrl,
  type BackendBaseUrlSource,
} from "./backendConfig";
import { ApiError, requestJson } from "./http";
import type {
  ArchivedNotesCursor,
  ArchivedNotesPage,
  NoteArchiveState,
  CreateNoteInput,
  DailyNoteCount,
  DailyNoteCountsResponse,
  ListNoteTagsResponse,
  ListNotesResponse,
  NoteDto,
  NoteLinkInput,
  NoteRecord,
  NoteResponse,
  NotesQuery,
  RecentNotesQuery,
  UpdateNoteInput,
} from "./types";
import { resolveRequiredFieldName } from "./defaultField";

import { orderNotes } from "../features/notes/noteStateUtils";

/** Defines a workspace ID value or lazy resolver. */
type WorkspaceIdSource = string | (() => string | Promise<string>);

/** Defines the frontend note data access boundary. */
export interface NotesClient {
  /** Reads unique, undeleted incoming sources, including archived notes. */
  listBacklinks(noteId: string): Promise<NoteDto[]>;
  /** Draws five active workspace notes when more than twenty are eligible. */
  getRandomNotes?: () => Promise<{ eligibleCount: number; notes: NoteDto[] }>;
  /** Optional lifecycle capabilities supplied by the Supabase client. */
  countArchivedNotes?: () => Promise<number>;
  listArchivedNotes?: (cursor?: ArchivedNotesCursor) => Promise<ArchivedNotesPage>;
  setNoteArchived?: (noteId: string, archived: boolean) => Promise<NoteArchiveState>;
  /** Lists recent notes ordered by update time for the home feed. */
  listRecentNotes(query?: RecentNotesQuery): Promise<NoteDto[]>;
  /** Lists visible note counts for the requested number of recent calendar days. */
  listDailyNoteCounts(dayCount: number): Promise<DailyNoteCount[]>;
  /** Lists notes using the provided query filters. */
  listNotes(query: NotesQuery): Promise<NoteDto[]>;
  /** Reads a single note by full ID or unique prefix. */
  getNote(noteRef: string): Promise<NoteDto>;
  /** Creates a note using the provided input. */
  createNote(input: CreateNoteInput): Promise<NoteDto>;
  /** Updates a note by full ID or unique prefix. */
  updateNote(noteRef: string, input: UpdateNoteInput): Promise<NoteDto>;
  /** Soft deletes a note by full ID or unique prefix. */
  deleteNote(noteRef: string): Promise<void>;
}

/** Defines configuration for the HTTP notes client. */
export interface NotesHttpClientOptions {
  /** Base URL for the Zembra backend API. */
  baseUrl: BackendBaseUrlSource;
  /** Workspace UUID sent as the required note CRUD request scope. */
  workspaceId: WorkspaceIdSource;
}

/** Creates a notes client backed by the Zembra OpenAPI HTTP server. */
export function createNotesHttpClient(
  options: NotesHttpClientOptions,
): NotesClient {
  const { baseUrl, workspaceId } = options;

  return {
    async listBacklinks(noteId) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const query = await createWorkspaceQuery(workspaceId);
      const target = await requestJson<NoteResponse>(resolvedBaseUrl, `/notes/${encodeURIComponent(noteId)}`, { query });
      const ids = [...new Set((target.metadata.backlinks ?? []).map((link) => link.source_note_id))].filter((id) => id !== noteId);
      const notes: NoteDto[] = [];
      for (let start = 0; start < ids.length; start += 6) {
        const page = await Promise.all(ids.slice(start, start + 6).map(async (id) => {
          try {
            const response = await requestJson<NoteResponse>(resolvedBaseUrl, `/notes/${encodeURIComponent(id)}`, { query });
            return response.note.deleted_at == null ? mapNoteResponseToDto(response) : undefined;
          } catch (error) {
            if (error instanceof ApiError && error.status === 404) return undefined;
            throw error;
          }
        }));
        notes.push(...page.filter((note): note is NoteDto => Boolean(note)));
      }
      return orderNotes(notes);
    },
    async listRecentNotes(query = {}) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const workspaceQuery = await createWorkspaceQuery(workspaceId);
      const response = await requestJson<ListNotesResponse>(
        resolvedBaseUrl,
        "/notes/recent",
        {
          method: "POST",
          query: workspaceQuery,
          body: {
            limit: query.limit ?? 50,
            note_uuid: query.noteUuid,
            role: query.role,
          },
        },
      );
      const notes = await Promise.all(
        response.notes.map(async (note) =>
          mapNoteRecordToDto(
            note,
            await listTagNames(resolvedBaseUrl, workspaceId, note.id),
          ),
        ),
      );

      return notes;
    },
    async listDailyNoteCounts(_dayCount) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const response = await requestJson<DailyNoteCountsResponse>(
        resolvedBaseUrl,
        "/notes/stats/daily-counts",
        {
          query: await createWorkspaceQuery(workspaceId),
        },
      );

      return response.days;
    },
    async listNotes(query) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const response = await requestJson<ListNotesResponse>(
        resolvedBaseUrl,
        "/notes",
        {
          query: await createWorkspaceQuery(workspaceId),
        },
      );
      const notes = await Promise.all(
        response.notes.map(async (note) =>
          mapNoteRecordToDto(
            note,
            await listTagNames(resolvedBaseUrl, workspaceId, note.id),
          ),
        ),
      );

      return filterNotes(notes, query);
    },
    async getNote(noteRef) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const response = await requestJson<NoteResponse>(
        resolvedBaseUrl,
        `/notes/${encodeURIComponent(noteRef)}`,
        {
          query: await createWorkspaceQuery(workspaceId),
        },
      );
      return mapNoteResponseToDto(response);
    },
    async createNote(input) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const response = await requestJson<NoteResponse>(
        resolvedBaseUrl,
        "/notes",
        {
          method: "POST",
          query: await createWorkspaceQuery(workspaceId),
          body: {
            content: input.content,
            device_id: input.deviceId,
            field: resolveRequiredFieldName(input.field),
            links: mapNoteLinksToRequest(input.links ?? []),
            role: input.role ?? "Human",
            tags: input.tags ?? [],
          },
        },
      );

      return mapNoteResponseToDto(response);
    },
    async updateNote(noteRef, input) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      const response = await requestJson<NoteResponse>(
        resolvedBaseUrl,
        `/notes/${encodeURIComponent(noteRef)}`,
        {
          method: "PATCH",
          query: await createWorkspaceQuery(workspaceId),
          body: {
            content: input.content,
            device_id: input.deviceId,
            field:
              input.field === undefined
                ? undefined
                : resolveRequiredFieldName(input.field),
            links: input.links
              ? mapNoteLinksToRequest(input.links)
              : input.links,
            tags: input.tags,
          },
        },
      );

      return mapNoteResponseToDto(response);
    },
    async deleteNote(noteRef) {
      const resolvedBaseUrl = resolveBackendBaseUrl(baseUrl);
      await requestJson<void>(
        resolvedBaseUrl,
        `/notes/${encodeURIComponent(noteRef)}`,
        {
          method: "DELETE",
          query: await createWorkspaceQuery(workspaceId),
        },
      );
    },
  };
}

/** Maps frontend link inputs to the backend request field names. */
function mapNoteLinksToRequest(links: NoteLinkInput[]) {
  return links.map((link) => ({
    anchor_text: link.anchorText,
    position: link.position,
    target_note_ref: link.targetNoteRef,
  }));
}

/** Maps a backend note response wrapper to the frontend note DTO. */
export function mapNoteResponseToDto(response: NoteResponse): NoteDto {
  return mapNoteRecordToDto(response.note, response.metadata.tags);
}

/** Maps a backend note record and resolved tag names to the frontend note DTO. */
export function mapNoteRecordToDto(note: NoteRecord, tags: string[] = []): NoteDto {
  return {
    id: note.id,
    content: note.content,
    role: note.role,
    fieldId: note.field_id ?? undefined,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
    tags,
  };
}

/** Loads tag paths for a note from the backend. */
async function listTagNames(
  baseUrl: string,
  workspaceId: WorkspaceIdSource,
  noteRef: string,
): Promise<string[]> {
  const response = await requestJson<ListNoteTagsResponse>(
    baseUrl,
    `/notes/${encodeURIComponent(noteRef)}/tags`,
    {
      query: await createWorkspaceQuery(workspaceId),
    },
  );

  return response.tags.map((tag) => tag.path);
}

/** Creates the required backend workspace query scope for note endpoints. */
async function createWorkspaceQuery(workspaceId: WorkspaceIdSource): Promise<{
  /** Workspace UUID sent to the backend as `workspace_id`. */
  workspace_id: string;
}> {
  return {
    workspace_id:
      typeof workspaceId === "function" ? await workspaceId() : workspaceId,
  };
}

/** Applies UI-level keyword and tag filters to note DTOs. */
function filterNotes(notes: NoteDto[], query: NotesQuery): NoteDto[] {
  return notes.filter((note) => {
    const keywordMatched =
      !query.keyword || note.content.includes(query.keyword);
    const tagMatched = !query.tag || note.tags.includes(query.tag);
    const fieldMatched = !query.fieldId || note.fieldId === query.fieldId;
    return keywordMatched && tagMatched && fieldMatched;
  });
}
