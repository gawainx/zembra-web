import {
  defaultBackendBaseUrl,
  defaultWorkspaceId,
  getConfiguredWorkspaceId,
  getEffectiveBackendBaseUrl,
} from "../backendConfig";
import { createNotesHttpClient, type NotesClient } from "../notes.client";
import { createSyncHttpClient, type SyncClient } from "../sync.client";
import { createTaxonomyHttpClient, type TaxonomyClient } from "../taxonomy.client";
import { requestJson } from "../http";
import type { ListWorkspacesResponse } from "../types";

let activeNotesClient: NotesClient | undefined;
let activeTaxonomyClient: TaxonomyClient | undefined;
let activeSyncClient: SyncClient | undefined;

/** Resolves the Backend API base URL from saved user config or Vite defaults. */
const resolveDefaultApiBaseUrl = () =>
  getEffectiveBackendBaseUrl(defaultBackendBaseUrl);

/** Resolves the workspace scope required by Backend note requests. */
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

/** Loads workspace summaries from the configured Backend API. */
export async function listWorkspaces(): Promise<ListWorkspacesResponse> {
  return requestJson<ListWorkspacesResponse>(resolveDefaultApiBaseUrl(), "/workspaces");
}

/** Activates Backend business clients for a workspace confirmed by the entry flow. */
export function activateDataSource(
  workspaceIdOrClient: string | unknown,
  optionalWorkspaceId?: string,
): void {
  const workspaceId = typeof workspaceIdOrClient === "string"
    ? workspaceIdOrClient
    : optionalWorkspaceId;

  if (!workspaceId) {
    throw new Error("Backend data source activation requires a workspace ID");
  }

  activeNotesClient = createNotesHttpClient({
    baseUrl: resolveDefaultApiBaseUrl,
    workspaceId: async () => workspaceId,
  });
  activeTaxonomyClient = createTaxonomyHttpClient({
    baseUrl: resolveDefaultApiBaseUrl,
    workspaceId: async () => workspaceId,
  });
  activeSyncClient = createSyncHttpClient({ baseUrl: resolveDefaultApiBaseUrl });
  console.info("[zembra] Activated Backend data source", {
    workspaceId: workspaceId.slice(0, 8),
  });
}

/** Returns the active Backend notes client. */
export function getNotesClient(): NotesClient {
  if (!activeNotesClient) {
    throw new Error("No Backend data source is active; complete the entry flow first");
  }

  return activeNotesClient;
}

/** Returns the active Backend taxonomy client. */
export function getTaxonomyClient(): TaxonomyClient {
  if (!activeTaxonomyClient) {
    throw new Error("No Backend data source is active; complete the entry flow first");
  }

  return activeTaxonomyClient;
}

/** Returns the Backend synchronization client available after workspace activation. */
export function getSyncClient(): SyncClient {
  if (!activeSyncClient) {
    throw new Error("No Backend data source is active; complete the entry flow first");
  }

  return activeSyncClient;
}
