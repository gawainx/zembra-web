import type { NotesClient } from "./notes.client";
import type { SyncClient } from "./sync.client";
import type { TaxonomyClient } from "./taxonomy.client";

/** Identifies the remote data source selected for the current application session. */
export type DataSourceMode = "backend" | "supabase";

/** Local storage key used to restore the selected data-source mode on the entry screen. */
export const dataSourceModeStorageKey = "zembra.dataSourceMode";

/** Groups business clients bound to one data source and workspace. */
export interface DataSourceClients {
  /** Client that reads and writes note data. */
  notes: NotesClient;
  /** Client that reads and writes fields and tags. */
  taxonomy: TaxonomyClient;
  /** Optional Backend-only synchronization client. */
  sync?: SyncClient;
}

/** Represents the data source currently activated after the entry flow succeeds. */
export interface ActiveDataSource extends DataSourceClients {
  /** Selected remote implementation. */
  mode: DataSourceMode;
  /** Workspace scope for every business request. */
  workspaceId: string;
}

let activeDataSource: ActiveDataSource | undefined;

/** Reads the selected data-source mode while treating unknown stored values as Backend. */
export function getStoredDataSourceMode(): DataSourceMode {
  return window.localStorage.getItem(dataSourceModeStorageKey) === "supabase"
    ? "supabase"
    : "backend";
}

/** Persists the data-source mode chosen in the entry screen. */
export function setStoredDataSourceMode(mode: DataSourceMode): void {
  window.localStorage.setItem(dataSourceModeStorageKey, mode);
}

/** Activates data clients after the entry flow confirms its mode and workspace. */
export function activateDataSource(dataSource: ActiveDataSource): void {
  activeDataSource = dataSource;
  console.info("[zembra] Activated data source", {
    mode: dataSource.mode,
    workspaceId: dataSource.workspaceId.slice(0, 8),
  });
}

/** Clears the active data source before a mode or workspace change. */
export function clearActiveDataSource(): void {
  activeDataSource = undefined;
}

/** Returns the current active source or reports an entry-flow ordering error. */
export function getActiveDataSource(): ActiveDataSource {
  if (!activeDataSource) {
    throw new Error("No data source is active; complete the entry flow first");
  }

  return activeDataSource;
}

/** Checks whether the entry flow has activated a source for the current application session. */
export function hasActiveDataSource(): boolean {
  return activeDataSource !== undefined;
}

/** Returns the active NotesClient without exposing its provider to feature code. */
export function getActiveNotesClient(): NotesClient {
  return getActiveDataSource().notes;
}

/** Returns the active TaxonomyClient without exposing its provider to feature code. */
export function getActiveTaxonomyClient(): TaxonomyClient {
  return getActiveDataSource().taxonomy;
}

/** Returns the active Backend sync client when the selected mode supports synchronization. */
export function getActiveSyncClient(): SyncClient | undefined {
  return getActiveDataSource().sync;
}
