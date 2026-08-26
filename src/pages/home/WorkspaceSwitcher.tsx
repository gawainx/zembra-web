import { ChevronDown } from "lucide-react";
import { useRef } from "react";
import type { ActiveWorkspace } from "../../app/workspace-context";

/** Renders a text-width workspace selector with a native disclosure menu. */
export function WorkspaceSwitcher({
  workspace,
  workspaces,
  onWorkspaceChange,
}: {
  /** Currently active workspace displayed by the trigger. */
  workspace: ActiveWorkspace;
  /** Authorized workspaces displayed by the disclosure menu. */
  workspaces: ActiveWorkspace[];
  /** Activates one workspace selected from the menu. */
  onWorkspaceChange: (workspaceId: string) => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  /** Activates the selected workspace and closes the native disclosure. */
  function handleWorkspaceClick(workspaceId: string) {
    onWorkspaceChange(workspaceId);
    detailsRef.current?.removeAttribute("open");
  }

  return (
    <details className="relative w-fit" ref={detailsRef}>
      <summary className="flex cursor-pointer list-none items-center gap-0 text-lg font-bold text-[var(--color-text-primary)] [&::-webkit-details-marker]:hidden">
        <span>{workspace.name}</span>
        <ChevronDown className="size-[var(--icon-size)]" aria-hidden="true" />
      </summary>
      <div className="absolute left-0 top-full z-40 mt-[var(--space-1)] min-w-full w-max overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-[var(--space-1)] shadow-[var(--color-shadow-float)]">
        {workspaces.map((option) => (
          <button
            className={`block w-full whitespace-nowrap px-[var(--space-2)] py-[var(--space-1)] text-left text-base text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] ${
              option.id === workspace.id ? "font-bold" : "font-normal"
            }`}
            key={option.id}
            type="button"
            onClick={() => handleWorkspaceClick(option.id)}
          >
            {option.name}
          </button>
        ))}
      </div>
    </details>
  );
}
