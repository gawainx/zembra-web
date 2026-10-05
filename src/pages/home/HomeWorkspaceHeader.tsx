import { ThemeToggle } from "../../app/ThemeToggle";
import { useWorkspace } from "../../app/workspace-context";
import { SourceStatusFeedback, SourceToolbarActions } from "@zembra/source-home-controls";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

/** Shares the existing workspace header across the note views. */
export function HomeWorkspaceHeader() {
  const { workspace, workspaces, switchWorkspace, renameWorkspace } = useWorkspace();
  return (
    <>
      <div className="mb-[var(--space-3)] flex items-center justify-between gap-[var(--space-3)]">
        <div className="flex min-w-0 items-center gap-[var(--space-2)] text-lg font-bold">
          <span className="text-[2em] leading-none">ℤ</span>
          <WorkspaceSwitcher
            workspace={workspace}
            workspaces={workspaces}
            onWorkspaceChange={switchWorkspace}
            onWorkspaceRename={renameWorkspace}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SourceToolbarActions />
          <ThemeToggle />
        </div>
      </div>
      <SourceStatusFeedback />
    </>
  );
}
