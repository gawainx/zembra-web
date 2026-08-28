import { act } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { NotesClient } from "../../api/notes.client";
import type { TaxonomyClient } from "../../api/taxonomy.client";
import type { NoteDto } from "../../api/types";

const clientMocks = vi.hoisted(() => ({
  notes: {} as Partial<NotesClient>,
  taxonomy: {} as Partial<TaxonomyClient>,
}));

vi.mock("../../api/client", () => ({
  getNotesClient: () => clientMocks.notes,
  getTaxonomyClient: () => clientMocks.taxonomy,
}));

import { useNotesStore } from "./noteStore";

const existingNote: NoteDto = {
  content: "existing note",
  createdAt: 10,
  id: "note-1",
  role: "Human",
  tags: [],
  updatedAt: 10,
};

afterEach(() => {
  clientMocks.notes = {};
  clientMocks.taxonomy = {};
  useNotesStore.setState({
    dailyNoteCounts: [],
    fields: [],
    notePreviewById: {},
    notes: [],
    roleNavigationNotes: [],
    selectedRole: undefined,
    tags: [],
  });
});

/** Creates a promise whose completion is controlled by one test. */
function createDeferred<T>() {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

/** Verifies a newly submitted note is visible before the remote request completes. */
test("adds a temporary note before create completion and replaces it on success", async () => {
  const deferred = createDeferred<NoteDto>();
  clientMocks.notes = {
    createNote: vi.fn(() => deferred.promise),
    listDailyNoteCounts: vi.fn(async () => []),
  };
  clientMocks.taxonomy = {
    listFields: vi.fn(async () => []),
    listTags: vi.fn(async () => []),
  };

  let request!: Promise<void>;
  act(() => {
    request = useNotesStore.getState().createNote({ content: "new note" });
  });

  expect(useNotesStore.getState().notes[0]).toMatchObject({
    content: "new note",
    id: expect.stringMatching(/^pending-/),
  });

  deferred.resolve({ ...existingNote, content: "new note", id: "note-2" });
  await request;

  expect(useNotesStore.getState().notes[0]).toMatchObject({ id: "note-2" });
});

/** Verifies a deleted note is restored at its former position if the remote request fails. */
test("removes a note before delete completion and restores it on failure", async () => {
  const deferred = createDeferred<void>();
  clientMocks.notes = {
    deleteNote: vi.fn(() => deferred.promise),
  };
  useNotesStore.setState({
    notes: [existingNote],
    roleNavigationNotes: [existingNote],
  });

  let request!: Promise<void>;
  act(() => {
    request = useNotesStore.getState().deleteNote(existingNote.id);
  });

  expect(useNotesStore.getState().notes).toEqual([]);

  deferred.reject(new Error("offline"));
  await expect(request).resolves.toBeUndefined();

  expect(useNotesStore.getState().notes).toEqual([existingNote]);
  expect(useNotesStore.getState().roleNavigationNotes).toEqual([existingNote]);
});

/** Verifies an edited note is visible immediately and rolls back on remote failure. */
test("updates a note before completion and restores it on failure", async () => {
  const deferred = createDeferred<NoteDto>();
  clientMocks.notes = {
    updateNote: vi.fn(() => deferred.promise),
  };
  useNotesStore.setState({
    notes: [existingNote],
    roleNavigationNotes: [existingNote],
  });

  let request!: Promise<void>;
  act(() => {
    request = useNotesStore.getState().updateNote(existingNote.id, {
      content: "edited note",
    });
  });

  expect(useNotesStore.getState().notes[0].content).toBe("edited note");

  deferred.reject(new Error("offline"));
  await expect(request).resolves.toBeUndefined();

  expect(useNotesStore.getState().notes).toEqual([existingNote]);
});
