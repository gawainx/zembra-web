import { create } from "zustand";
import { notifyMutationCompleted } from "../../app/mutationToast";
import {
  getNotesClient,
  getTaxonomyClient,
} from "@zembra/data-source-runtime";
import type {
  CreateNoteInput,
  DailyNoteCount,
  FieldDto,
  NoteDto,
  TagDto,
  UpdateNoteInput,
} from "../../api/types";

interface NotesState {
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

const remoteMutationQueues = new Map<string, Promise<void>>();
const remoteMutationVersions = new Map<string, number>();

/** Stores note list state for the card note interface. */
export const useNotesStore = create<NotesState>((set, get) => ({
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
    const notes = await getNotesClient().listRecentNotes({
      limit: 50,
      role: selectedRole,
    });
    set((state) => ({
      notes,
      roleNavigationNotes:
        selectedRole === undefined || state.roleNavigationNotes.length === 0
          ? notes
          : state.roleNavigationNotes,
    }));
  },
  loadRecentNotes: async () => {
    const selectedRole = get().selectedRole;
    const notes = await getNotesClient().listRecentNotes({
      limit: 50,
      role: selectedRole,
    });
    set((state) => ({
      notes,
      roleNavigationNotes:
        selectedRole === undefined || state.roleNavigationNotes.length === 0
          ? notes
          : state.roleNavigationNotes,
    }));
  },
  loadDailyNoteCounts: async (dayCount) => {
    const dailyNoteCounts = await getNotesClient().listDailyNoteCounts(dayCount);
    set({ dailyNoteCounts, dailyNoteCountDays: dayCount });
  },
  createNote: async (input) => {
    const temporaryNote = createTemporaryNote(input, get().fields);
    const createRequest = getNotesClient().createNote(input);
    set((state) => ({
      notes:
        state.selectedRole === undefined || state.selectedRole === temporaryNote.role
          ? [temporaryNote, ...state.notes].slice(0, 50)
          : state.notes,
      roleNavigationNotes: [temporaryNote, ...state.roleNavigationNotes].slice(0, 50),
    }));

    try {
      const note = await createRequest;
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
    const current = get();
    const previousNote = current.notes.find((note) => note.id === noteRef)
      ?? current.roleNavigationNotes.find((note) => note.id === noteRef);

    if (!previousNote) {
      return;
    }

    const version = nextMutationVersion(`note:${previousNote.id}`);
    const optimisticNote: NoteDto = {
      ...previousNote,
      content: input.content,
      fieldId:
        current.fields.find((field) => field.name === input.field)?.id
        ?? previousNote.fieldId,
      tags: input.tags ?? previousNote.tags,
      updatedAt: Math.floor(Date.now() / 1000),
    };
    set((state) => ({
      notes:
        state.selectedRole === undefined || state.selectedRole === optimisticNote.role
          ? [optimisticNote, ...state.notes.filter((item) => item.id !== optimisticNote.id)].slice(
              0,
              50,
            )
          : state.notes.filter((item) => item.id !== optimisticNote.id),
      roleNavigationNotes: [
        optimisticNote,
        ...state.roleNavigationNotes.filter((item) => item.id !== optimisticNote.id),
      ].slice(0, 50),
    }));

    return enqueueRemoteMutation(`note:${previousNote.id}`, async () => {
      try {
        const note = await getNotesClient().updateNote(noteRef, input);
        if (isCurrentMutation(`note:${previousNote.id}`, version)) {
          set((state) => ({
            notes: replaceNote(state.notes, optimisticNote.id, note),
            roleNavigationNotes: replaceNote(
              state.roleNavigationNotes,
              optimisticNote.id,
              note,
            ),
          }));
        }
        console.info("[zembra] Updated note", { noteId: note.id });
        notifyMutationCompleted({ duration: 3000, message: "noteUpdated", tone: "success" });
        void refreshNoteMetadata(set, get);
      } catch (error) {
        if (isCurrentMutation(`note:${previousNote.id}`, version)) {
          set((state) => ({
            notes: replaceNote(state.notes, optimisticNote.id, previousNote),
            roleNavigationNotes: replaceNote(
              state.roleNavigationNotes,
              optimisticNote.id,
              previousNote,
            ),
          }));
        }
        console.warn("[zembra] Failed to update note", { error, noteId: previousNote.id });
        notifyMutationCompleted({ duration: 10000, message: "noteUpdateFailed", tone: "error" });
      }
    });
  },
  deleteNote: async (noteRef) => {
    const current = get();
    const noteIndex = current.notes.findIndex((note) => note.id === noteRef);
    const roleNavigationNoteIndex = current.roleNavigationNotes.findIndex(
      (note) => note.id === noteRef,
    );
    const note = current.notes[noteIndex];
    const roleNavigationNote = current.roleNavigationNotes[roleNavigationNoteIndex];
    const preview = current.notePreviewById[noteRef];
    const version = nextMutationVersion(`note:${noteRef}`);

    set((state) => ({
      notes: state.notes.filter((note) => note.id !== noteRef),
      roleNavigationNotes: state.roleNavigationNotes.filter(
        (note) => note.id !== noteRef,
      ),
      notePreviewById: omitNotePreview(state.notePreviewById, noteRef),
    }));

    return enqueueRemoteMutation(`note:${noteRef}`, async () => {
      try {
        await getNotesClient().deleteNote(noteRef);
        console.info("[zembra] Deleted note", { noteId: noteRef });
        notifyMutationCompleted({ duration: 3000, message: "noteDeleted", tone: "success" });
        void refreshNoteMetadata(set, get);
      } catch (error) {
        if (isCurrentMutation(`note:${noteRef}`, version)) {
          set((state) => ({
            notes: restoreNote(state.notes, note, noteIndex),
            roleNavigationNotes: restoreNote(
              state.roleNavigationNotes,
              roleNavigationNote,
              roleNavigationNoteIndex,
            ),
            notePreviewById: preview
              ? { ...state.notePreviewById, [noteRef]: preview }
              : state.notePreviewById,
          }));
        }
        console.warn("[zembra] Failed to delete note", { error, noteId: noteRef });
        notifyMutationCompleted({ duration: 10000, message: "noteDeleteFailed", tone: "error" });
      }
    });
  },
  deleteField: async (fieldId) => {
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
        await getTaxonomyClient().deleteField(fieldId);
        console.info("[zembra] Deleted field", { fieldId });
        notifyMutationCompleted({ duration: 3000, message: "fieldDeleted", tone: "success" });
      } catch (error) {
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
        await getTaxonomyClient().deleteTagTree(tagsToDelete);
        console.info("[zembra] Deleted tag tree", { path, tagCount: tagsToDelete.length });
        notifyMutationCompleted({ duration: 3000, message: "tagDeleted", tone: "success" });
      } catch (error) {
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
    const feedNote = state.notes.find((note) => note.id === noteRef);

    if (feedNote) {
      return feedNote;
    }

    const cachedNote = state.notePreviewById[noteRef];

    if (cachedNote) {
      return cachedNote;
    }

    const note = await getNotesClient().getNote(noteRef);
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

    const fields = await getTaxonomyClient().listFields();
    set({ fields });
  },
  loadTags: async () => {
    const existingTags = get().tags;

    if (existingTags.length > 0) {
      return;
    }

    const tags = await getTaxonomyClient().listTags();
    set({ tags });
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

/** Restores a removed note at its original index when a delete request fails. */
function restoreNote(
  notes: NoteDto[],
  note: NoteDto | undefined,
  index: number,
): NoteDto[] {
  if (!note || index < 0) {
    return notes;
  }

  return [...notes.slice(0, index), note, ...notes.slice(index)].slice(0, 50);
}

/** Removes one cached note preview without mutating the existing cache object. */
function omitNotePreview(
  notePreviewById: Record<string, NoteDto>,
  noteId: string,
): Record<string, NoteDto> {
  const { [noteId]: _removed, ...remainingPreviews } = notePreviewById;

  return remainingPreviews;
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
  try {
    const dayCount = get().dailyNoteCountDays;
    const [fields, tags, dailyNoteCounts] = await Promise.all([
      getTaxonomyClient().listFields(),
      getTaxonomyClient().listTags(),
      dayCount === undefined
        ? Promise.resolve(get().dailyNoteCounts)
        : getNotesClient().listDailyNoteCounts(dayCount),
    ]);
    set({ dailyNoteCounts, fields, tags });
  } catch (error) {
    console.warn("[zembra] Failed to refresh note metadata", { error });
  }
}
