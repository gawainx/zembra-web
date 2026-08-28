import { createContext, ReactNode, useContext, useMemo } from "react";

/** One workspace available to the authenticated active data source. */
export interface ActiveWorkspace {
  /** Stable workspace identifier used as the data-source scope. */
  id: string;
  /** Human-readable workspace name shown in navigation. */
  name: string;
  /** Plain workspace name used in browser metadata. */
  title: string;
}

interface WorkspaceContextValue {
  /** Currently active workspace. */
  workspace: ActiveWorkspace;
  /** Workspaces the current data source authorizes for selection. */
  workspaces: ActiveWorkspace[];
  /** Activates and persists a newly selected authorized workspace. */
  switchWorkspace: (workspaceId: string) => void;
  /** Renames a workspace when the active data source supports it. */
  renameWorkspace?: (workspaceId: string, name: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

/** Provides the active workspace scope to routed application content. */
export function WorkspaceProvider({
  children,
  workspace,
  workspaces,
  switchWorkspace,
  renameWorkspace,
}: WorkspaceContextValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({ workspace, workspaces, switchWorkspace, renameWorkspace }),
    [renameWorkspace, switchWorkspace, workspace, workspaces],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

/** Returns the workspace scope established by the active data-source gate. */
export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);

  if (!value) {
    throw new Error("Workspace context is unavailable outside DataSourceGate");
  }

  return value;
}
