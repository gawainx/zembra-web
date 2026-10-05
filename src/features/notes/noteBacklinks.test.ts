import { beforeEach, expect, test, vi } from "vitest";
import type { NotesClient } from "../../api/notes.client";
import type { NoteDto } from "../../api/types";
import { noteBacklinkExcerpt } from "./noteLinkUtils";
const mocks = vi.hoisted(() => ({ client: {} as Partial<NotesClient>, taxonomy: { listFields: vi.fn(async () => []), listTags: vi.fn(async () => []) } }));
vi.mock("@zembra/data-source-runtime", () => ({ getNotesClient: () => mocks.client, getTaxonomyClient: () => mocks.taxonomy }));
import { useNotesStore } from "./noteStore";
const state = () => useNotesStore.getState();
const source: NoteDto = { id: "source", content: "source [[target]]", createdAt: 10, updatedAt: 10, role: "Human", tags: [] };
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
beforeEach(() => {
  useNotesStore.setState(useNotesStore.getInitialState(), true);
  mocks.client = { listBacklinks: vi.fn(async () => [source]), updateNote: vi.fn(async (_id, input) => ({ ...source, ...input })), deleteNote: vi.fn(async () => {}), createNote: vi.fn(async () => source) };
  state().connectWorkspace();
});

test("deduplicates sources independently of feed filters and retains archived sources", async () => {
  const archived = { ...source, id: "archived", createdAt: 20, archivedAt: 30 };
  mocks.client.listBacklinks = vi.fn(async () => [source, archived, source]);
  useNotesStore.setState({ notes: [], selectedTag: "unrelated", selectedField: "other" });
  await state().loadBacklinks("target");
  expect(state().backlinksByNoteId.target.map((note) => note.id)).toEqual(["archived", "source"]);
  await state().loadBacklinks("target");
  expect(mocks.client.listBacklinks).toHaveBeenCalledTimes(1);
});

test("projects edits immediately and a failed earlier edit cannot undo a later intent", async () => {
  await state().loadBacklinks("target");
  const first = deferred<NoteDto>(), second = deferred<NoteDto>();
  mocks.client.updateNote = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const a = state().updateNote(source.id, { content: "removed" });
  expect(state().backlinksByNoteId.target).toEqual([]);
  const b = state().updateNote(source.id, { content: "latest [[target]] [[target]]" });
  expect(state().backlinksByNoteId.target).toHaveLength(1);
  first.reject(new Error("offline")); await a;
  expect(state().backlinksByNoteId.target[0].content).toBe("latest [[target]] [[target]]");
  second.resolve({ ...source, content: "latest [[target]] [[target]]" }); await b;
  expect(state().backlinksByNoteId.target).toHaveLength(1);
});

test("deletion removes a source immediately and failure restores it", async () => {
  await state().loadBacklinks("target");
  const pending = deferred<void>(); mocks.client.deleteNote = vi.fn(() => pending.promise);
  const request = state().deleteNote(source.id);
  expect(state().backlinksByNoteId.target).toEqual([]);
  pending.reject(new Error("offline")); await request;
  expect(state().backlinksByNoteId.target).toEqual([source]);
});

test("an old incoming read cannot restore a link removed while loading", async () => {
  const pending = deferred<NoteDto[]>(); mocks.client.listBacklinks = vi.fn(() => pending.promise);
  useNotesStore.setState({ notes: [source] });
  const read = state().loadBacklinks("target");
  await state().updateNote(source.id, { content: "removed" });
  pending.resolve([source]); await read;
  expect(state().backlinksByNoteId.target).toEqual([]);
});

test("creation is visible before completion, survives a concurrent read and replaces its temporary ID", async () => {
  const read = deferred<NoteDto[]>(), write = deferred<NoteDto>();
  mocks.client.listBacklinks = vi.fn(() => read.promise);
  mocks.client.createNote = vi.fn(() => write.promise);
  const loading = state().loadBacklinks("target");
  const creating = state().createNote({ content: source.content });
  expect(state().backlinksByNoteId.target[0].id).toMatch(/^pending-/);
  read.resolve([]); await loading;
  expect(state().backlinksByNoteId.target).toHaveLength(1);
  write.resolve(source); await creating;
  expect(state().backlinksByNoteId.target).toEqual([source]);
});

test("failed creation removes its optimistic incoming source", async () => {
  await state().loadBacklinks("target");
  const write = deferred<NoteDto>(); mocks.client.createNote = vi.fn(() => write.promise);
  const creating = state().createNote({ content: "new [[target]]" });
  expect(state().backlinksByNoteId.target).toHaveLength(2);
  write.reject(new Error("offline")); await expect(creating).rejects.toThrow();
  expect(state().backlinksByNoteId.target).toEqual([source]);
});

test("leaving a workspace clears sources and discards late reads", async () => {
  const pending = deferred<NoteDto[]>(); mocks.client.listBacklinks = vi.fn(() => pending.promise);
  const read = state().loadBacklinks("target");
  mocks.client = { listBacklinks: vi.fn(async () => []) }; state().connectWorkspace();
  pending.resolve([source]); await read;
  expect(state().backlinksByNoteId).toEqual({});
  expect(state().backlinkStatus).toEqual({});
});

test("read failure is retryable and does not freeze the feed", async () => {
  mocks.client.listBacklinks = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([source]);
  await state().loadBacklinks("target"); expect(state().backlinkStatus.target).toBe("error");
  state().setKeyword("still usable"); expect(state().keyword).toBe("still usable");
  await state().loadBacklinks("target", true); expect(state().backlinksByNoteId.target).toEqual([source]);
});

test("excerpt keeps the literal prefix, normalizes line endings and preserves Unicode", () => {
  expect(noteBacklinkExcerpt("# raw\r\n**literal**\n[[target]]")).toBe("# raw **literal** [[target]]");
  expect(noteBacklinkExcerpt("😀".repeat(121))).toBe("😀".repeat(120) + "…");
});

test("returning to the same client does not admit a read from its previous visit", async () => {
  const old = deferred<NoteDto[]>(); mocks.client.listBacklinks = vi.fn(() => old.promise);
  const original = mocks.client;
  const read = state().loadBacklinks("target");
  mocks.client = {}; state().connectWorkspace();
  mocks.client = original; state().connectWorkspace();
  old.resolve([source]); await read;
  expect(state().backlinksByNoteId).toEqual({});
});

test("archiving a source preserves the incoming relationship", async () => {
  await state().loadBacklinks("target");
  mocks.client.listArchivedNotes = vi.fn(async () => ({ notes: [] }));
  mocks.client.setNoteArchived = vi.fn(async (id) => ({ id, archivedAt: 30, updatedAt: 30 }));
  const write = state().setNoteArchived(source.id, true);
  expect(state().backlinksByNoteId.target[0].archivedAt).not.toBeNull();
  await write;
  expect(state().backlinksByNoteId.target[0]).toMatchObject({ id: source.id, archivedAt: 30 });
});
