import {
  defaultBackendBaseUrl,
  defaultWorkspaceId,
  getConfiguredWorkspaceId,
  getEffectiveBackendBaseUrl,
} from "./backendConfig";
import {
  createMockNotesClient,
  createNotesHttpClient,
  type NotesClient,
} from "./notes.client";
import {
  createMockTaxonomyClient,
  createTaxonomyHttpClient,
  type TaxonomyClient,
} from "./taxonomy.client";
import {
  createMockSyncClient,
  createSyncHttpClient,
  type SyncClient,
} from "./sync.client";
import {
  getActiveNotesClient,
  getActiveSyncClient,
  getActiveTaxonomyClient,
  hasActiveDataSource,
} from "./data-source-client";
import { getActiveDataSource, type DataSourceMode } from "./data-source-client";
import { createSupabaseNotesClient } from "./supabase-notes.client";
import { createSupabaseTaxonomyClient } from "./supabase-taxonomy.client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DataSourceClients } from "./data-source-client";
import { requestJson } from "./http";
import type { ListWorkspacesResponse } from "./types";

/** Resolves the API base URL from saved user config or Vite defaults. */
const resolveDefaultApiBaseUrl = () =>
  getEffectiveBackendBaseUrl(defaultBackendBaseUrl);

/** Resolves the default workspace scope used by note CRUD requests. */
export async function resolveDefaultWorkspaceId(): Promise<string> {
  const configuredWorkspaceId = defaultWorkspaceId.trim();

  if (configuredWorkspaceId) {
    return configuredWorkspaceId;
  }

  const savedWorkspaceId = getConfiguredWorkspaceId();

  if (!savedWorkspaceId) {
    throw new Error("No workspace available for note API requests");
  }

  return savedWorkspaceId;
}

/** Loads workspace summaries from the currently configured backend API. */
export async function listWorkspaces(): Promise<ListWorkspacesResponse> {
  return requestJson<ListWorkspacesResponse>(
    resolveDefaultApiBaseUrl(),
    "/workspaces",
  );
}

/** Creates the default notes client configured for the current Vite environment. */
export function createDefaultNotesClient(): NotesClient {
  if (import.meta.env.MODE === "test") {
    return createMockNotesClient();
  }

  return createNotesHttpClient({
    baseUrl: resolveDefaultApiBaseUrl,
    workspaceId: resolveDefaultWorkspaceId,
  });
}

/** Creates the default taxonomy client configured for the current Vite environment. */
export function createDefaultTaxonomyClient(): TaxonomyClient {
  if (import.meta.env.MODE === "test") {
    return createMockTaxonomyClient();
  }

  return createTaxonomyHttpClient({
    baseUrl: resolveDefaultApiBaseUrl,
    workspaceId: resolveDefaultWorkspaceId,
  });
}

/** Creates the default sync client configured for the current Vite environment. */
export function createDefaultSyncClient(): SyncClient {
  if (import.meta.env.MODE === "test") {
    return createMockSyncClient();
  }

  return createSyncHttpClient({ baseUrl: resolveDefaultApiBaseUrl });
}

/** Default notes client shared by feature stores. */
export const notesClient = createDefaultNotesClient();

/** Default taxonomy client shared by feature stores. */
export const taxonomyClient = createDefaultTaxonomyClient();

/** Default sync client shared by settings pages. */
export const syncClient = createDefaultSyncClient();

/** Creates Backend clients scoped to the workspace confirmed by the Backend entry flow. */
export function createBackendDataSourceClients(workspaceId: string): DataSourceClients {
  if (import.meta.env.MODE === "test") {
    return { notes: createMockNotesClient(), sync: createMockSyncClient(), taxonomy: createMockTaxonomyClient() };
  }

  return {
    notes: createNotesHttpClient({ baseUrl: resolveDefaultApiBaseUrl, workspaceId }),
    sync: createSyncHttpClient({ baseUrl: resolveDefaultApiBaseUrl }),
    taxonomy: createTaxonomyHttpClient({ baseUrl: resolveDefaultApiBaseUrl, workspaceId }),
  };
}

/** Creates Supabase clients scoped to the workspace confirmed by the Supabase entry flow. */
export function createSupabaseDataSourceClients(client: SupabaseClient, workspaceId: string): DataSourceClients {
  return {
    notes: createSupabaseNotesClient(client, workspaceId),
    taxonomy: createSupabaseTaxonomyClient(client, workspaceId),
  };
}

/** Returns the active notes client, falling back to the existing Backend client before entry completes. */
export function getNotesClient(): NotesClient {
  return hasActiveDataSource() ? getActiveNotesClient() : notesClient;
}

/** Returns the active taxonomy client, falling back to the existing Backend client before entry completes. */
export function getTaxonomyClient(): TaxonomyClient {
  return hasActiveDataSource() ? getActiveTaxonomyClient() : taxonomyClient;
}

/** Returns the active sync client, when the selected data source supports Backend synchronization. */
export function getSyncClient(): SyncClient | undefined {
  return hasActiveDataSource() ? getActiveSyncClient() : syncClient;
}

/** Returns the selected source mode, defaulting to Backend before the entry flow completes. */
export function getDataSourceMode(): DataSourceMode {
  return hasActiveDataSource() ? getActiveDataSource().mode : "backend";
}
