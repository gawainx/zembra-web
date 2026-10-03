import type { NotesClient } from "../../api/notes.client";
import type { MutationToastMessage } from "../../app/mutationToast";
import { isActiveNote, orderNotes, overlayNotes, projectedMutation, projectNote, type NoteIntent, type NoteMutation } from "./noteStateUtils";
import { create } from "zustand";
import { notifyMutationCompleted } from "../../app/mutationToast";
import {
  getNotesClient,
  getTaxonomyClient,
} from "@zembra/data-source-runtime";
import type {
  ArchivedNotesCursor,
  CreateNoteInput,
  DailyNoteCount,
  FieldDto,
  NoteDto,
  TagDto,
  UpdateNoteInput,
} from "../../api/types";

interface NotesState {
  scopeClient?: NotesClient;
  supportsArchiving: boolean;
  noteView: "active" | "archived";
  archivedNotes: NoteDto[];
  archivedNoteCount?: number;
  loadArchivedNoteCount: () => Promise<void>;
  archiveLoading: boolean;
  archiveError: boolean;
  archiveCursor?: ArchivedNotesCursor;
  connectWorkspace: () => void;
  setNoteView: (view: "active" | "archived") => void;
  loadArchivedNotes: (resume?: boolean) => Promise<void>;
  setNoteArchived: (noteId: string, archived: boolean) => Promise<void>;
  /** Recent notes currently visible in the home feed. */
  notes: NoteDto[];
  /** Recent notes loaded without a role filter for role navigation counts. */
  roleNavigationNotes: NoteDto[];
  /** Fields available for note organization. */
  fields: FieldDto[];
  /** Tags available for note organization. */
  tags: TagDto[];
  /** Daily note counts used by the home activity heatmap. */
  dailyNoteCounts: DailyNoteCount[];
  /** Number of calendar days represented by the loaded heatmap counts. */
  dailyNoteCountDays?: number;
  /** Cached notes loaded only for link previews. */
  notePreviewById: Record<string, NoteDto>;
  /** Search keyword entered by the user. */
  keyword: string;
  /** Tag selected by the user. */
  selectedTag?: string;
  /** Field selected by the user. */
  selectedField?: string;
  /** Role selected by the user. */
  selectedRole?: string;
  /** Replaces the active search keyword. */
  setKeyword: (keyword: string) => void;
  /** Replaces the selected tag filter. */
  setSelectedTag: (tag?: string) => void;
  /** Replaces the selected field filter. */
  setSelectedField: (field?: string) => void;
  /** Replaces the selected role filter and reloads recent notes. */
  setSelectedRole: (role?: string) => Promise<void>;
  /** Loads recent notes from the home feed endpoint. */
  loadRecentNotes: () => Promise<void>;
  /** Loads visible note counts for the requested number of calendar days. */
  loadDailyNoteCounts: (dayCount: number) => Promise<void>;
  /** Creates a note and places it at the top of the recent feed. */
  createNote: (input: CreateNoteInput) => Promise<void>;
  /** Updates a note and moves it to the top of the recent feed. */
  updateNote: (noteRef: string, input: UpdateNoteInput) => Promise<void>;
  /** Deletes a note and removes it from the recent feed. */
  deleteNote: (noteRef: string) => Promise<void>;
  /** Deletes an unused field and refreshes field navigation state. */
  deleteField: (fieldId: string) => Promise<void>;
  /** Deletes an empty tag and every empty descendant in its subtree. */
  deleteTagTree: (path: string) => Promise<void>;
  /** Loads a note for link preview without changing the recent feed. */
  loadNotePreview: (noteRef: string) => Promise<NoteDto>;
  /** Loads fields from the active taxonomy client. */
  loadFields: () => Promise<void>;
  /** Loads tags from the active taxonomy client. */
  loadTags: () => Promise<void>;
}

let readVersion = 0;
let archiveReadVersion = 0;
let archiveCountReadVersion = 0;
let metadataReadVersion = 0;
let mutationEpoch = 0;
const noteMutations = new WeakMap<NotesClient, Map<string, NoteMutation>>();
const remoteMutationQueues = new Map<string, Promise<void>>();
const remoteMutationVersions = new Map<string, number>();

/** Stores note list state for the card note interface. */
export const useNotesStore = create<NotesState>((set, get) => ({
  scopeClient: undefined,
  supportsArchiving: false,
  noteView: "active",
  archivedNotes: [],
  archivedNoteCount: undefined,
  archiveLoading: false,
  archiveError: false,
  archiveCursor: undefined,
  connectWorkspace: () => {
    const client = getNotesClient();
    if (get().scopeClient === client) return;
    if (get().scopeClient) {
      ++readVersion; ++archiveReadVersion; ++metadataReadVersion;
      set({ archivedNoteCount: undefined, notes: [], roleNavigationNotes: [], archivedNotes: [], notePreviewById: {}, fields: [], tags: [],
        dailyNoteCounts: [], noteView: "active", keyword: "", selectedRole: undefined,
        selectedField: undefined, selectedTag: undefined, archiveCursor: undefined, archiveError: false, archiveLoading: false });
    }
    set({ scopeClient: client, supportsArchiving: Boolean(client.listArchivedNotes && client.setNoteArchived) });
    void get().loadArchivedNoteCount();
  },
  setNoteView: (noteView) => {
    if (noteView === "archived" && !get().supportsArchiving) return;
    if (get().noteView !== noteView) set({ noteView, keyword: "", selectedRole: undefined, selectedField: undefined, selectedTag: undefined });
    if (noteView === "archived") {
      set({ keyword: "", selectedRole: undefined, selectedField: undefined, selectedTag: undefined });
      void get().loadArchivedNotes();
    } else {
      ++archiveReadVersion;
      set({ archiveLoading: false });
    }
  },
  loadArchivedNoteCount: async () => {
    const client = getNotesClient();
    if (!client.countArchivedNotes || hasPendingNotes(client)) return;
    const version = ++archiveCountReadVersion;
    const since = mutationEpoch;
    try {
      const count = await client.countArchivedNotes();
      if (!isActiveClient(client) || version !== archiveCountReadVersion || since !== mutationEpoch || hasPendingNotes(client)) return;
      set({ archivedNoteCount: count });
    } catch (error) {
      if (isActiveClient(client) && version === archiveCountReadVersion) console.warn("[zembra] Failed to load archive count", { error });
    }
  },
  loadArchivedNotes: async (resume = false) => {
    const client = getNotesClient();
    if (!client.listArchivedNotes) return;
    void get().loadArchivedNoteCount();
    const version = ++archiveReadVersion;
    const since = mutationEpoch;
    let cursor = resume ? get().archiveCursor : undefined;
    let collected = resume ? get().archivedNotes : [];
    set({ archiveLoading: true, archiveError: false, archiveCursor: cursor });
    try {
      for (;;) {
        const page = await client.listArchivedNotes(cursor);
        if (!isActiveClient(client) || version !== archiveReadVersion) return;
        const seen = new Map([...collected, ...page.notes].map((note) => [note.id, note]));
        collected = [...seen.values()];
        const archivedNotes = overlayNotes(collected, noteMutations.get(client), since).filter((note) => note.archivedAt != null);
        if (page.nextCursor && cursor && page.nextCursor.id === cursor.id && page.nextCursor.createdAt === cursor.createdAt) throw new Error("Archive cursor did not advance");
        cursor = page.nextCursor;
        set({ archivedNotes, archiveCursor: cursor });
        if (!cursor) break;
      }
      set({ archiveLoading: false });
    } catch (error) {
      if (!isActiveClient(client) || version !== archiveReadVersion) return;
      console.warn("[zembra] Failed to load archived notes", { error });
      set({ archiveLoading: false, archiveError: true });
    }
  },
  setNoteArchived: async (noteId, archived) => {
    const client = getNotesClient();
    if (!client.setNoteArchived || !client.listArchivedNotes || noteId.startsWith("pending-")) return;
    const previous = findNote(get(), noteId);
    if (!previous) return;
    const now = Math.max(Math.floor(Date.now() / 1000), previous.createdAt, previous.updatedAt);
    return mutateNote(set, get, client, noteId, { archivedAt: archived ? now : null, updatedAt: now },
      () => client.setNoteArchived!(noteId, archived),
      archived ? "noteArchived" : "noteUnarchived", archived ? "noteArchiveFailed" : "noteUnarchiveFailed");
  },
  notes: [],
  roleNavigationNotes: [],
  fields: [],
  tags: [],
  dailyNoteCounts: [],
  dailyNoteCountDays: undefined,
  notePreviewById: {},
  keyword: "",
  selectedTag: undefined,
  selectedField: undefined,
  selectedRole: undefined,
  setKeyword: (keyword) => set({ keyword }),
  setSelectedTag: (selectedTag) => set({ selectedTag }),
  setSelectedField: (selectedField) => set({ selectedField }),
  setSelectedRole: async (selectedRole) => {
    set({ selectedRole });
    await loadRecentForRole(set, get);
  },
  loadRecentNotes: () => loadRecentForRole(set, get),
  loadDailyNoteCounts: async (dayCount) => {
    const client = getNotesClient();
    const version = ++metadataReadVersion;
    const since = mutationEpoch;
    set({ dailyNoteCountDays: dayCount });
    const dailyNoteCounts = await client.listDailyNoteCounts(dayCount);
    if (!isActiveClient(client) || version !== metadataReadVersion) return;
    if (since !== mutationEpoch || hasPendingNotes(client)) return;
    set({ dailyNoteCounts, dailyNoteCountDays: dayCount });
  },
  createNote: async (input) => {
    const temporaryNote = createTemporaryNote(input, get().fields);
    const client = getNotesClient();
    set((state) => ({
      notes:
        state.selectedRole === undefined || state.selectedRole === temporaryNote.role
          ? [temporaryNote, ...state.notes].slice(0, 50)
          : state.notes,
      roleNavigationNotes: [temporaryNote, ...state.roleNavigationNotes].slice(0, 50),
    }));

    try {
      const note = await client.createNote(input);
      if (!isActiveClient(client)) return;
      set((state) => ({
        notes: replaceNote(state.notes, temporaryNote.id, note),
        roleNavigationNotes: replaceNote(
          state.roleNavigationNotes,
          temporaryNote.id,
          note,
        ),
      }));
      console.info("[zembra] Created note", { noteId: note.id });
      notifyMutationCompleted({
        duration: 3000,
        message: "noteCreated",
        tone: "success",
      });
      void refreshNoteMetadata(set, get);
    } catch (error) {
      if (!isActiveClient(client)) return;
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== temporaryNote.id),
        roleNavigationNotes: state.roleNavigationNotes.filter(
          (note) => note.id !== temporaryNote.id,
        ),
      }));
      console.warn("[zembra] Failed to create note", { error });
      notifyMutationCompleted({
        duration: 10000,
        message: "noteCreateFailed",
        tone: "error",
      });
      throw error;
    }
  },
  updateNote: async (noteRef, input) => {
    const client = getNotesClient();
    const current = get();
    const previous = findNote(current, noteRef);
    if (!previous) return;
    const patch: Partial<NoteDto> = {
      content: input.content,
      fieldId: current.fields.find((field) => field.name === input.field)?.id ?? previous.fieldId,
      tags: input.tags ?? previous.tags,
      updatedAt: Math.max(Math.floor(Date.now() / 1000), previous.createdAt),
    };
    return mutateNote(set, get, client, noteRef, patch, () => client.updateNote(noteRef, input), "noteUpdated", "noteUpdateFailed");
  },
  deleteNote: async (noteRef) => {
    const client = getNotesClient();
    return mutateNote(set, get, client, noteRef, null, async () => { await client.deleteNote(noteRef); return null; }, "noteDeleted", "noteDeleteFailed");
  },
  deleteField: async (fieldId) => {
    const client = getNotesClient();
    const taxonomy = getTaxonomyClient();
    const current = get();
    const fieldIndex = current.fields.findIndex((field) => field.id === fieldId);
    const field = current.fields[fieldIndex];
    const version = nextMutationVersion(`field:${fieldId}`);
    set((state) => ({
      fields: state.fields.filter((item) => item.id !== fieldId),
      selectedField: state.selectedField === fieldId ? undefined : state.selectedField,
    }));

    return enqueueRemoteMutation(`field:${fieldId}`, async () => {
      try {
        await taxonomy.deleteField(fieldId);
        if (!isActiveClient(client)) return;
        console.info("[zembra] Deleted field", { fieldId });
        notifyMutationCompleted({ duration: 3000, message: "fieldDeleted", tone: "success" });
      } catch (error) {
        if (!isActiveClient(client)) return;
        if (field && isCurrentMutation(`field:${fieldId}`, version)) {
          set((state) => ({
            fields: [...state.fields.slice(0, fieldIndex), field, ...state.fields.slice(fieldIndex)],
          }));
        }
        console.warn("[zembra] Failed to delete field", { error, fieldId });
        notifyMutationCompleted({ duration: 10000, message: "fieldDeleteFailed", tone: "error" });
      }
    });
  },
  deleteTagTree: async (path) => {
    const client = getNotesClient();
    const taxonomy = getTaxonomyClient();
    const current = get();
    const tagsToDelete = current.tags.filter((tag) => isTagInSubtree(tag.path, path));

    if (tagsToDelete.length === 0) {
      return;
    }

    if (current.notes.some((note) => note.tags.some((tag) => isTagInSubtree(tag, path)))) {
      throw new Error("Cannot delete a tag that is used by notes");
    }

    const version = nextMutationVersion(`tag:${path}`);
    const previousTags = current.tags;
    const previousSelectedTag = current.selectedTag;
    set((state) => ({
      selectedTag: state.selectedTag && isTagInSubtree(state.selectedTag, path)
        ? undefined
        : state.selectedTag,
      tags: state.tags.filter((tag) => !isTagInSubtree(tag.path, path)),
    }));

    return enqueueRemoteMutation(`tag:${path}`, async () => {
      try {
        await taxonomy.deleteTagTree(tagsToDelete);
        if (!isActiveClient(client)) return;
        console.info("[zembra] Deleted tag tree", { path, tagCount: tagsToDelete.length });
        notifyMutationCompleted({ duration: 3000, message: "tagDeleted", tone: "success" });
      } catch (error) {
        if (!isActiveClient(client)) return;
        if (isCurrentMutation(`tag:${path}`, version)) {
          set({ selectedTag: previousSelectedTag, tags: previousTags });
        }
        console.warn("[zembra] Failed to delete tag tree", { error, path });
        notifyMutationCompleted({ duration: 10000, message: "tagDeleteFailed", tone: "error" });
      }
    });
  },
  loadNotePreview: async (noteRef) => {
    const state = get();
    const feedNote = findNote(state, noteRef);

    if (feedNote) {
      return feedNote;
    }

    const cachedNote = state.notePreviewById[noteRef];

    if (cachedNote) {
      return cachedNote;
    }

    const client = getNotesClient();
    const since = mutationEpoch;
    const loaded = await client.getNote(noteRef);
    if (!isActiveClient(client)) return loaded;
    const mutation = noteMutations.get(client)?.get(loaded.id);
    const note = mutation && (mutation.intents.length || mutation.epoch > since) ? projectedMutation(mutation) : loaded;
    if (!note) throw new Error("Note is no longer available");
    set((current) => ({
      notePreviewById: {
        ...current.notePreviewById,
        [note.id]: note,
      },
    }));
    return note;
  },
  loadFields: async () => {
    const existingFields = get().fields;

    if (existingFields.length > 0) {
      return;
    }

    const client = getNotesClient();
    const fields = await getTaxonomyClient().listFields();
    if (isActiveClient(client)) set({ fields });
  },
  loadTags: async () => {
    const existingTags = get().tags;

    if (existingTags.length > 0) {
      return;
    }

    const client = getNotesClient();
    const tags = await getTaxonomyClient().listTags();
    if (isActiveClient(client)) set({ tags });
  },
}));

/** Returns the next operation version for one entity. */
function nextMutationVersion(entityKey: string): number {
  const version = (remoteMutationVersions.get(entityKey) ?? 0) + 1;
  remoteMutationVersions.set(entityKey, version);
  return version;
}

/** Returns whether one queued operation is still the latest local intent. */
function isCurrentMutation(entityKey: string, version: number): boolean {
  return remoteMutationVersions.get(entityKey) === version;
}

/** Serializes remote writes per entity without delaying optimistic UI updates. */
function enqueueRemoteMutation(
  entityKey: string,
  operation: () => Promise<void>,
): Promise<void> {
  const previous = remoteMutationQueues.get(entityKey) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(operation);
  remoteMutationQueues.set(entityKey, next);
  void next.finally(() => {
    if (remoteMutationQueues.get(entityKey) === next) {
      remoteMutationQueues.delete(entityKey);
    }
  });
  return next;
}

/** Creates an in-memory note used until the remote create request resolves. */
function createTemporaryNote(input: CreateNoteInput, fields: FieldDto[]): NoteDto {
  const timestamp = Math.floor(Date.now() / 1000);

  return {
    content: input.content,
    createdAt: timestamp,
    fieldId: fields.find((field) => field.name === input.field)?.id,
    id: `pending-${crypto.randomUUID()}`,
    role: input.role ?? "Human",
    tags: input.tags ?? [],
    updatedAt: timestamp,
  };
}

/** Replaces a temporary note with its persisted form while preserving list order. */
function replaceNote(notes: NoteDto[], temporaryId: string, note: NoteDto): NoteDto[] {
  return notes.map((item) => (item.id === temporaryId ? note : item));
}

/** Returns whether a tag path is the requested root or one of its descendants. */
function isTagInSubtree(tagPath: string, rootPath: string): boolean {
  return tagPath === rootPath || tagPath.startsWith(`${rootPath}/`);
}

/** Refreshes navigation metadata after a confirmed remote note mutation. */
async function refreshNoteMetadata(
  set: (partial: Pick<NotesState, "dailyNoteCounts" | "fields" | "tags">) => void,
  get: () => NotesState,
): Promise<void> {
  const client = getNotesClient();
  const taxonomy = getTaxonomyClient();
  const version = ++metadataReadVersion;
  const since = mutationEpoch;
  try {
    const dayCount = get().dailyNoteCountDays;
    const [fields, tags, dailyNoteCounts] = await Promise.all([
      taxonomy.listFields(),
      taxonomy.listTags(),
      dayCount === undefined
        ? Promise.resolve(get().dailyNoteCounts)
        : client.listDailyNoteCounts(dayCount),
    ]);
    if (isActiveClient(client) && version === metadataReadVersion && since === mutationEpoch && !hasPendingNotes(client)) set({ dailyNoteCounts, fields, tags });
  } catch (error) {
    console.warn("[zembra] Failed to refresh note metadata", { error });
  }
}

/** Client identity is tied to the activated workspace by the existing runtime. */
function isActiveClient(client: NotesClient): boolean {
  return getNotesClient() === client;
}
function hasPendingNotes(client: NotesClient): boolean {
  return [...(noteMutations.get(client)?.values() ?? [])].some((mutation) => mutation.intents.length > 0);
}
function findNote(state: NotesState, id: string): NoteDto | undefined {
  return state.notes.find((note) => note.id === id) ?? state.archivedNotes.find((note) => note.id === id)
    ?? state.roleNavigationNotes.find((note) => note.id === id) ?? state.notePreviewById[id];
}

/** Applies local intent now, then serializes the captured client's writes per note. */
async function mutateNote(
  set: (state: Partial<NotesState> | ((state: NotesState) => Partial<NotesState>)) => void,
  get: () => NotesState, client: NotesClient, id: string, patch: Partial<NoteDto> | null,
  write: () => Promise<Partial<NoteDto> | null>, success: MutationToastMessage, failure: MutationToastMessage,
): Promise<void> {
  let mutations = noteMutations.get(client);
  if (!mutations) { mutations = new Map(); noteMutations.set(client, mutations); }
  let mutation = mutations.get(id);
  const existing = findNote(get(), id);
  if (!existing && !mutation) return;
  if (!mutation || !mutation.intents.length) {
    mutation = { confirmed: existing ?? mutation!.confirmed, intents: [], queue: Promise.resolve(), epoch: mutationEpoch };
    mutations.set(id, mutation);
  }
  const current = mutation;
  const previous = projectedMutation(current);
  const intent: NoteIntent = { patch };
  current.intents.push(intent);
  current.epoch = ++mutationEpoch;
  const next = projectedMutation(current);
  set((state) => projectNote(state, id, previous, next));
  console.info("[zembra] Starting note mutation", { noteId: id, action: success });
  const operation = current.queue.catch(() => undefined).then(async () => {
    let error: unknown;
    try {
      const result = await write();
      current.confirmed = result && current.confirmed ? { ...current.confirmed, ...result } : null;
    } catch (cause) { error = cause; }
    const before = projectedMutation(current);
    current.intents = current.intents.filter((pending) => pending !== intent);
    current.epoch = ++mutationEpoch;
    const after = projectedMutation(current);
    if (!isActiveClient(client)) return;
    // Use the last locally visible record for the activity delta, not the updated server base.
    set((state) => projectNote(state, id, findNote(state, id) ?? before, after));
    console[error ? "warn" : "info"]("[zembra] Note mutation completed", { noteId: id, action: success, failed: Boolean(error) });
    notifyMutationCompleted({ duration: error ? 10000 : 3000, message: error ? failure : success, tone: error ? "error" : "success" });
    if (!hasPendingNotes(client)) {
      void get().loadArchivedNoteCount();
      void refreshNoteMetadata(set, get);
    }
  });
  current.queue = operation;
  return operation;
}

/** Loads the selected role without depending on a replaceable initial-load action. */
async function loadRecentForRole(set: (value: (state: NotesState) => Partial<NotesState>) => void, get: () => NotesState): Promise<void> {
  const client = getNotesClient();
  const version = ++readVersion;
  const since = mutationEpoch;
  const selectedRole = get().selectedRole;
  const result = await client.listRecentNotes({ limit: 50, role: selectedRole });
  if (!isActiveClient(client) || version !== readVersion) return;
  const notes = overlayNotes(result, noteMutations.get(client), since).filter((note) => isActiveNote(note) && (!selectedRole || note.role === selectedRole)).slice(0, 50);
  set((state) => ({ notes, roleNavigationNotes: selectedRole === undefined || state.roleNavigationNotes.length === 0 ? notes : state.roleNavigationNotes }));
}
