import { describe, expect, test, vi } from "vitest";
import { createSupabaseNotesClient } from "./supabase-notes.client";

type Call = { table: string; steps: Array<[string, ...unknown[]]> };
type Result = { data: unknown; error: { message: string } | null };
function mockClient(run: (call: Call) => Result) {
  const calls: Call[] = [];
  const client = { from(table: string) {
    const call: Call = { table, steps: [] };
    const query: Record<string, unknown> = {};
    for (const method of ["select", "eq", "is", "not", "order", "limit", "or", "range", "in", "update", "ilike", "single"]) {
      query[method] = (...args: unknown[]) => { call.steps.push([method, ...args]); return query; };
    }
    query.then = (resolve: (result: Result) => void, reject: (reason: unknown) => void) => {
      calls.push(call);
      return Promise.resolve().then(() => run(call)).then(resolve, reject);
    };
    return query;
  } };
  return { api: createSupabaseNotesClient(client as never, "workspace-a"), calls };
}
const row = { id: "note-a", content: "preserve me", role: "Human", field_id: null, created_at: 10, updated_at: 20, archived_at: 20 };
const ok = (data: unknown): Result => ({ data, error: null });

describe("Supabase archive", () => {
  test("writes only lifecycle fields and confirms the exact workspace row", async () => {
    const { api, calls } = mockClient((call) => call.steps.some(([name]) => name === "update")
      ? ok({ id: row.id, archived_at: 30, updated_at: 30 }) : ok(row));
    expect(await api.setNoteArchived!(row.id, true)).toEqual({ id: row.id, archivedAt: 30, updatedAt: 30 });
    for (const call of calls) {
      expect(call.steps).toContainEqual(["eq", "workspace_id", "workspace-a"]);
      expect(call.steps).toContainEqual(["eq", "id", row.id]);
      expect(call.steps).toContainEqual(["is", "deleted_at", null]);
    }
    const update = calls[1].steps.find(([name]) => name === "update")![1] as Record<string, number>;
    expect(Object.keys(update).sort()).toEqual(["archived_at", "updated_at"]);
    expect(update.archived_at).toBe(update.updated_at);
    expect(update.archived_at).toBeGreaterThanOrEqual(row.created_at);
    expect(calls.map((call) => call.table)).toEqual(["notes", "notes"]);
  });

  test("unarchives without changing content or creating revisions", async () => {
    const { api, calls } = mockClient((call) => call.steps.some(([name]) => name === "update")
      ? ok({ id: row.id, archived_at: null, updated_at: 30 }) : ok(row));
    expect((await api.setNoteArchived!(row.id, false)).archivedAt).toBeNull();
    expect(calls[1].steps).toContainEqual(["update", { archived_at: null, updated_at: expect.any(Number) }]);
  });

  test.each([null, { message: "permission denied" }])("rejects missing or denied archive writes: %s", async (error) => {
    const { api } = mockClient((call) => call.steps.some(([name]) => name === "update") ? { data: null, error } : ok(row));
    await expect(api.setNoteArchived!(row.id, true)).rejects.toThrow();
  });

  test("keeps advancing after short pages and loads all capped tag associations", async () => {
    const { api, calls } = mockClient((call) => {
      if (call.table === "notes") return call.steps.some(([name]) => name === "or") ? ok([]) : ok([row]);
      const offset = call.steps.find(([name]) => name === "range")![1] as number;
      if (call.table === "tags") return ok(offset < 2 ? [{ id: `tag-${offset}`, path: `topic/${offset}` }] : []);
      return ok(offset < 2 ? [{ note_id: row.id, tag_id: `tag-${offset}` }] : []);
    });
    const first = await api.listArchivedNotes!();
    expect(first.notes[0]).toMatchObject({ archivedAt: 20, tags: ["topic/0", "topic/1"] });
    expect(first.nextCursor).toEqual({ createdAt: 10, id: row.id });
    expect(await api.listArchivedNotes!(first.nextCursor)).toEqual({ notes: [], nextCursor: undefined });
    const pages = calls.filter((call) => call.table === "notes");
    expect(pages[0].steps).toContainEqual(["not", "archived_at", "is", null]);
    expect(pages[1].steps).toContainEqual(["or", 'created_at.lt.10,and(created_at.eq.10,id.lt."note-a")']);
  });

  test("excludes archives from recent notes, list notes, and activity counts", async () => {
    const { api, calls } = mockClient(() => ok([]));
    await api.listRecentNotes();
    await api.listNotes({});
    await api.listDailyNoteCounts(7);
    for (const call of calls) expect(call.steps).toContainEqual(["is", "archived_at", null]);
  });

  test("still reads an archived note for editing and previews", async () => {
    const { api, calls } = mockClient((call) => ok(call.table === "notes" ? [row] : []));
    expect(await api.getNote(row.id)).toMatchObject({ id: row.id, archivedAt: 20 });
    expect(calls[0].steps).not.toContainEqual(["is", "archived_at", null]);
  });
});
