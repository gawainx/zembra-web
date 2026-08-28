import { afterEach, expect, test } from "vitest";
import type { NotesClient } from "./notes.client";
import type { TaxonomyClient } from "./taxonomy.client";
import {
  activateDataSource,
  clearActiveDataSource,
  getActiveDataSource,
  getStoredDataSourceMode,
  setStoredDataSourceMode,
} from "./data-source-client";

afterEach(() => {
  clearActiveDataSource();
  window.localStorage.clear();
});

/** Verifies that the entry screen defaults to Backend mode when no selection is stored. */
test("defaults the stored data source mode to backend", () => {
  expect(getStoredDataSourceMode()).toBe("backend");
});

/** Verifies that a confirmed Supabase source remains available to feature-layer client lookups. */
test("activates a Supabase data source", () => {
  const notes = {} as NotesClient;
  const taxonomy = {} as TaxonomyClient;
  setStoredDataSourceMode("supabase");
  activateDataSource({
    mode: "supabase",
    notes,
    taxonomy,
    workspaceId: "workspace-supabase",
  });

  expect(getStoredDataSourceMode()).toBe("supabase");
  expect(getActiveDataSource()).toMatchObject({
    mode: "supabase",
    notes,
    taxonomy,
    workspaceId: "workspace-supabase",
  });
});
