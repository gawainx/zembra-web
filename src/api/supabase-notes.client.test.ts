import { describe, expect, test, vi } from "vitest";
import { createSupabaseNotesClient } from "./supabase-notes.client";

type Call = { table: string; steps: Array<[string, ...unknown[]]> };
type Result = { count?: number; data: unknown; error: { message: string } | null };
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


test.each([0, 1205])("counts %i undeleted archives without fetching rows", async (count) => {
  const { api, calls } = mockClient(() => ({ data: null, error: null, count }));
  expect(await api.countArchivedNotes!()).toBe(count);
  expect(calls).toEqual([{ table: "notes", steps: [
    ["select", "id", { count: "exact", head: true }], ["eq", "workspace_id", "workspace-a"],
    ["is", "deleted_at", null], ["not", "archived_at", "is", null],
  ] }]);
});

describe("Supabase random notes", () => {
  const notes = Array.from({ length: 5 }, (_, i) => ({ ...row, id: `random-${i}`, archived_at: null, tags: ["parent/child"] }));
  test("uses one workspace RPC and maps complete notes without extra requests", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { eligible_count: 21, notes }, error: null });
    const api = createSupabaseNotesClient({ rpc } as never, "workspace-a");
    const result = await api.getRandomNotes!();
    expect(rpc).toHaveBeenCalledWith("get_random_notes", { p_workspace_id: "workspace-a" });
    expect(result.eligibleCount).toBe(21);
    expect(result.notes).toHaveLength(5);
    expect(result.notes[0]).toMatchObject({ id: "random-0", archivedAt: null, tags: ["parent/child"] });
  });
  test.each([0, 20])("preserves the insufficient count %s", async (eligible_count) => {
    const api = createSupabaseNotesClient({ rpc: vi.fn().mockResolvedValue({ data: { eligible_count, notes: [] }, error: null }) } as never, "workspace-a");
    expect(await api.getRandomNotes!()).toEqual({ eligibleCount: eligible_count, notes: [] });
  });
  test("does not treat denied requests as insufficient notes", async () => {
    const api = createSupabaseNotesClient({ rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "denied" } }) } as never, "workspace-a");
    await expect(api.getRandomNotes!()).rejects.toThrow("denied");
  });
  test.each([null, { eligible_count: 21, notes: [] }, { eligible_count: 20, notes }, { eligible_count: 21, notes: Array(5).fill(notes[0]) }])("rejects invalid results", async (data) => {
    const api = createSupabaseNotesClient({ rpc: vi.fn().mockResolvedValue({ data, error: null }) } as never, "workspace-a");
    await expect(api.getRandomNotes!()).rejects.toThrow("Invalid random notes response");
  });
});
