import { beforeEach, expect, test, vi } from "vitest";
import type { NotesClient } from "../../api/notes.client";
import type { NoteArchiveState, NoteDto } from "../../api/types";
import { subscribeMutationToast } from "../../app/mutationToast";
const mocks = vi.hoisted(() => ({ notes: {} as NotesClient, taxonomy: { listFields: vi.fn(async () => []), listTags: vi.fn(async () => []) } }));
vi.mock("@zembra/data-source-runtime", () => ({ getNotesClient: () => mocks.notes, getTaxonomyClient: () => mocks.taxonomy }));
import { useNotesStore } from "./noteStore";
const note: NoteDto = { id: "n1", content: "original", createdAt: 10, updatedAt: 10, tags: ["topic"], role: "Human" };
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const state = () => useNotesStore.getState();
beforeEach(() => {
  useNotesStore.setState(useNotesStore.getInitialState(), true);
  mocks.notes = {
    listRecentNotes: vi.fn(async () => [note]), listDailyNoteCounts: vi.fn(async () => []),
    listNotes: vi.fn(async () => [note]), getNote: vi.fn(async () => note),
    createNote: vi.fn(async () => note), updateNote: vi.fn(async () => note), deleteNote: vi.fn(async () => {}),
    listArchivedNotes: vi.fn(async () => ({ notes: [] })),
    setNoteArchived: vi.fn(async (id, archived) => ({ id, archivedAt: archived ? 30 : null, updatedAt: 30 })),
  };
  state().connectWorkspace();
  useNotesStore.setState({ notes: [note], roleNavigationNotes: [note] });
});

test("moves immediately, restores on failure, and preserves data and preview", async () => {
  const pending = deferred<NoteArchiveState>();
  mocks.notes.setNoteArchived = vi.fn(() => pending.promise);
  useNotesStore.setState({ dailyNoteCounts: [{ date: "1970-01-01", count: 1 }], notePreviewById: { n1: note } });
  const notify = vi.fn(); const unsubscribe = subscribeMutationToast(notify);
  const request = state().setNoteArchived("n1", true);
  expect(state().notes).toEqual([]);
  expect(state().archivedNotes[0]).toMatchObject({ content: "original", tags: ["topic"] });
  expect(state().dailyNoteCounts[0].count).toBe(0);
  pending.reject(new Error("offline")); await request;
  expect(state().notes).toEqual([note]);
  expect(state().archivedNotes).toEqual([]);
  expect(state().notePreviewById.n1).toEqual(note);
  expect(state().dailyNoteCounts[0].count).toBe(1);
  expect(notify).toHaveBeenCalledWith({ duration: 10000, message: "noteArchiveFailed", tone: "error" });
  unsubscribe();
});

test("serializes opposite intents and recovers the confirmed state after both fail", async () => {
  const first = deferred<NoteArchiveState>(), second = deferred<NoteArchiveState>();
  mocks.notes.setNoteArchived = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const archive = state().setNoteArchived("n1", true);
  const restore = state().setNoteArchived("n1", false);
  await Promise.resolve(); await Promise.resolve();
  expect(mocks.notes.setNoteArchived).toHaveBeenCalledTimes(1);
  first.reject(new Error("offline")); await archive;
  expect(state().notes[0].archivedAt).toBeNull();
  second.reject(new Error("offline")); await restore;
  expect(state().notes).toEqual([note]);
  expect(state().archivedNotes).toEqual([]);
});

test("failed archive does not overwrite a newer successful edit", async () => {
  const first = deferred<NoteArchiveState>();
  mocks.notes.setNoteArchived = vi.fn(() => first.promise);
  mocks.notes.updateNote = vi.fn(async () => ({ ...note, content: "new content" }));
  const archive = state().setNoteArchived("n1", true);
  const edit = state().updateNote("n1", { content: "new content" });
  expect(state().archivedNotes[0].content).toBe("new content");
  first.reject(new Error("offline")); await archive; await edit;
  expect(state().notes[0]).toMatchObject({ content: "new content" });
  expect(state().archivedNotes).toEqual([]);
});

test("reads all archive pages beyond the recent-note limit and keeps lifecycle filters", async () => {
  const archived = Array.from({ length: 65 }, (_, i) => ({ ...note, id: `a${i}`, archivedAt: 20 }));
  mocks.notes.listArchivedNotes = vi.fn().mockResolvedValueOnce({ notes: archived.slice(0, 40), nextCursor: { id: "a39", createdAt: 10 } })
    .mockResolvedValueOnce({ notes: archived.slice(40), nextCursor: { id: "a64", createdAt: 10 } }).mockResolvedValueOnce({ notes: [] });
  await state().loadArchivedNotes();
  expect(state().archivedNotes).toHaveLength(65);
  expect(state().notes).toEqual([note]);
  expect(state().archiveLoading).toBe(false);
});

test("late archive pages cannot reinsert a restored note from an earlier page", async () => {
  const second = deferred<{ notes: NoteDto[] }>();
  mocks.notes.listArchivedNotes = vi.fn().mockResolvedValueOnce({ notes: [{ ...note, archivedAt: 20 }], nextCursor: { id: "n1", createdAt: 10 } }).mockReturnValueOnce(second.promise);
  const load = state().loadArchivedNotes();
  await Promise.resolve(); await Promise.resolve();
  // The active recent fixture must not shadow the archived server record.
  useNotesStore.setState({ notes: [], roleNavigationNotes: [] });
  await state().setNoteArchived("n1", false);
  second.resolve({ notes: [] }); await load;
  expect(state().archivedNotes).toEqual([]);
  expect(state().notes[0].archivedAt).toBeNull();
});

test("preserves loaded pages and resumes at the failed cursor", async () => {
  const cursor = { id: "n1", createdAt: 10 };
  mocks.notes.listArchivedNotes = vi.fn().mockResolvedValueOnce({ notes: [{ ...note, archivedAt: 20 }], nextCursor: cursor }).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ notes: [] });
  await state().loadArchivedNotes();
  expect(state().archiveError).toBe(true);
  expect(state().archivedNotes).toHaveLength(1);
  await state().loadArchivedNotes(true);
  expect(mocks.notes.listArchivedNotes).toHaveBeenLastCalledWith(cursor);
  expect(state().archiveError).toBe(false);
});

test("captures the original client for queued writes and suppresses old workspace results", async () => {
  const first = deferred<NoteArchiveState>();
  const old = mocks.notes;
  old.setNoteArchived = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValueOnce({ id: "n1", archivedAt: null, updatedAt: 31 });
  const notify = vi.fn(); const unsubscribe = subscribeMutationToast(notify);
  const one = state().setNoteArchived("n1", true);
  const two = state().setNoteArchived("n1", false);
  mocks.notes = { ...old, setNoteArchived: vi.fn() };
  state().connectWorkspace();
  first.resolve({ id: "n1", archivedAt: 30, updatedAt: 30 }); await one; await two;
  expect(old.setNoteArchived).toHaveBeenCalledTimes(2);
  expect(mocks.notes.setNoteArchived).not.toHaveBeenCalled();
  expect(state().notes).toEqual([]);
  expect(state().archivedNotes).toEqual([]);
  expect(notify).not.toHaveBeenCalled();
  unsubscribe();
});

test("discards archive reads after a workspace change", async () => {
  const pending = deferred<{ notes: NoteDto[] }>();
  mocks.notes.listArchivedNotes = () => pending.promise;
  const load = state().loadArchivedNotes();
  mocks.notes = { ...mocks.notes }; state().connectWorkspace();
  pending.resolve({ notes: [{ ...note, archivedAt: 20 }] }); await load;
  expect(state().archivedNotes).toEqual([]);
});

test("deletes archived notes and restores the archive after failure without active insertion", async () => {
  useNotesStore.setState({ notes: [], roleNavigationNotes: [], archivedNotes: [{ ...note, archivedAt: 20 }] });
  mocks.notes.deleteNote = vi.fn(async () => { throw new Error("offline"); });
  const request = state().deleteNote("n1");
  expect(state().archivedNotes).toEqual([]);
  await request;
  expect(state().notes).toEqual([]);
  expect(state().archivedNotes[0].archivedAt).toBe(20);
});

test("keeps archive view while creating a normal note and never exposes Backend capabilities", async () => {
  state().setNoteView("archived");
  await state().createNote({ content: "new" });
  expect(state().noteView).toBe("archived");
  expect(state().archivedNotes).toEqual([]);
  const { setNoteArchived: _write, listArchivedNotes: _list, ...backend } = mocks.notes;
  mocks.notes = backend; state().connectWorkspace();
  expect(state().supportsArchiving).toBe(false);
  state().setNoteView("archived");
  expect(state().noteView).toBe("active");
});


test("loads the archive total without downloading notes and rejects stale workspace counts", async () => {
  mocks.notes.countArchivedNotes = vi.fn(async () => 1205);
  await state().loadArchivedNoteCount();
  expect(state().archivedNoteCount).toBe(1205);
  expect(mocks.notes.listArchivedNotes).not.toHaveBeenCalled();
  const pending = deferred<number>();
  mocks.notes.countArchivedNotes = () => pending.promise;
  const read = state().loadArchivedNoteCount();
  mocks.notes = { ...mocks.notes, countArchivedNotes: vi.fn(async () => 3) };
  state().connectWorkspace();
  await state().loadArchivedNoteCount();
  pending.resolve(1205); await read;
  expect(state().archivedNoteCount).toBe(3);
});

test("updates the total optimistically, ignores stale reads, and rolls back failures", async () => {
  useNotesStore.setState({ archivedNoteCount: 7 });
  const count = deferred<number>();
  mocks.notes.countArchivedNotes = () => count.promise;
  const read = state().loadArchivedNoteCount();
  const write = deferred<NoteArchiveState>();
  mocks.notes.setNoteArchived = () => write.promise;
  const archive = state().setNoteArchived("n1", true);
  expect(state().archivedNoteCount).toBe(8);
  count.resolve(7); await read;
  expect(state().archivedNoteCount).toBe(8);
  write.reject(new Error("offline")); await archive;
  expect(state().archivedNoteCount).toBe(7);
});

test("deleting an archived note decrements the total and restores it on failure", async () => {
  useNotesStore.setState({ archivedNoteCount: 9, notes: [], roleNavigationNotes: [], archivedNotes: [{ ...note, archivedAt: 20 }] });
  mocks.notes.deleteNote = vi.fn(async () => { throw new Error("offline"); });
  const deletion = state().deleteNote("n1");
  expect(state().archivedNoteCount).toBe(8);
  await deletion;
  expect(state().archivedNoteCount).toBe(9);
});
