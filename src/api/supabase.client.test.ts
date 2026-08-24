import { afterEach, expect, test, vi } from "vitest";
import {
  getSupabasePublicConfig,
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
