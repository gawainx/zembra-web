import { afterEach, expect, test, vi } from "vitest";
import {
  getSupabasePublicConfig,
  renameSupabaseWorkspace,
  SupabaseConfigurationError,
} from "./supabase.client";

afterEach(() => {
  vi.unstubAllEnvs();
});

/** Verifies the public configuration only requires browser-safe Supabase connection values. */
test("reads the deployment-configured Supabase connection", () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "publishable-key");

  expect(getSupabasePublicConfig()).toEqual({
    publishableKey: "publishable-key",
    url: "https://project.supabase.co",
  });
});

/** Verifies a deployment cannot enter Supabase mode without its browser connection values. */
test("rejects Supabase configuration without a publishable key", () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

  expect(() => getSupabasePublicConfig()).toThrow(SupabaseConfigurationError);
});

/** Verifies workspace renaming targets one row and returns its updated name. */
test("renames an authorized workspace", async () => {
  vi.spyOn(Date, "now").mockReturnValue(1_779_382_320_000);
  const single = vi.fn(async () => ({
    data: { id: "workspace-1", workspace_name: "Renamed" },
    error: null,
  }));
  const select = vi.fn(() => ({ single }));
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));

  await expect(
    renameSupabaseWorkspace({ from } as never, "workspace-1", " Renamed "),
  ).resolves.toEqual({ id: "workspace-1", name: "Renamed" });

  expect(from).toHaveBeenCalledWith("workspaces");
  expect(update).toHaveBeenCalledWith({
    updated_at: 1_779_382_320,
    workspace_name: "Renamed",
  });
  expect(eq).toHaveBeenCalledWith("id", "workspace-1");
  expect(select).toHaveBeenCalledWith("id, workspace_name");
});
