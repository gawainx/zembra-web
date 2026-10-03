import { expect, test, vi } from "vitest";
import { createSupabaseTaxonomyClient } from "./supabase-taxonomy.client";

/** Verifies tag subtree deletion removes descendants before their parent. */
test("deletes Supabase tag subtrees from deepest descendant to root", async () => {
  const deletedIds: string[] = [];
  const client = {
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ in: () => ({ limit: async () => ({ data: [], error: null }) }) }) }),
      delete: () => ({
        eq: (_column: string, value: string) => ({
          eq: async (_idColumn: string, id: string) => {
            deletedIds.push(`${value}:${id}`);
            return { error: null };
          },
        }),
      }),
    })),
  };
  const taxonomy = createSupabaseTaxonomyClient(client as never, "workspace-1");

  await taxonomy.deleteTagTree([
    { id: "root", name: "root", path: "root", depth: 0, createdAt: 1 },
    { id: "child", name: "child", path: "root/child", depth: 1, createdAt: 1 },
  ]);

  expect(deletedIds).toEqual(["workspace-1:child", "workspace-1:root"]);
});

test("refuses to delete tags associated with archived or unloaded notes", async () => {
  const remove = vi.fn();
  const from = vi.fn(() => ({
    select: () => ({ eq: () => ({ in: () => ({ limit: async () => ({ data: [{ note_id: "archived-note" }], error: null }) }) }) }),
    delete: remove,
  }));
  const client = createSupabaseTaxonomyClient({ from } as never, "workspace-1");
  await expect(client.deleteTagTree([{ id: "used", name: "used", path: "used", depth: 0, createdAt: 1 }])).rejects.toThrow("used by notes");
  expect(remove).not.toHaveBeenCalled();
});
