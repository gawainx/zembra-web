import { afterEach, expect, test, vi } from "vitest";
import {
  getSupabasePublicConfig,
  SupabaseConfigurationError,
} from "./supabase.client";

afterEach(() => {
  vi.unstubAllEnvs();
});

/** Verifies the public configuration includes the workspace fixed by a deployment. */
test("reads the deployment-configured Supabase workspace", () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
  vi.stubEnv("VITE_SUPABASE_WORKSPACE_ID", "workspace-uuid");

  expect(getSupabasePublicConfig()).toEqual({
    publishableKey: "publishable-key",
    url: "https://project.supabase.co",
    workspaceId: "workspace-uuid",
  });
});

/** Verifies a deployment cannot enter Supabase mode without a fixed workspace. */
test("rejects Supabase configuration without a workspace", () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
  vi.stubEnv("VITE_SUPABASE_WORKSPACE_ID", "");

  expect(() => getSupabasePublicConfig()).toThrow(SupabaseConfigurationError);
});
