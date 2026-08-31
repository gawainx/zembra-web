import { expect, test, vi } from "vitest";
import { createSupabaseTaxonomyClient } from "./supabase-taxonomy.client";

/** Verifies tag subtree deletion removes descendants before their parent. */
test("deletes Supabase tag subtrees from deepest descendant to root", async () => {
  const deletedIds: string[] = [];
  const client = {
    from: vi.fn(() => ({
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
