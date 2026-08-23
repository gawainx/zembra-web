import { afterEach, expect, test, vi } from "vitest";
import {
  getSupabasePublicConfig,
  SupabaseConfigurationError,
} from "./supabase.client";

afterEach(() => {
  vi.unstubAllEnvs();
});

/** Verifies the public configuration includes all deployment-authorized workspace bindings. */
test("reads the deployment-configured Supabase workspaces", () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
  vi.stubEnv(
    "VITE_SUPABASE_WORKSPACES",
    JSON.stringify([
      { id: "workspace-uuid", name: "Personal notes", email: "me@example.com" },
    ]),
  );

  expect(getSupabasePublicConfig()).toEqual({
    publishableKey: "publishable-key",
    url: "https://project.supabase.co",
    workspaces: [
      { id: "workspace-uuid", name: "Personal notes", email: "me@example.com" },
    ],
  });
});

/** Verifies a deployment cannot enter Supabase mode without workspace bindings. */
test("rejects Supabase configuration without workspaces", () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
  vi.stubEnv("VITE_SUPABASE_WORKSPACES", "");

  expect(() => getSupabasePublicConfig()).toThrow(SupabaseConfigurationError);
});
