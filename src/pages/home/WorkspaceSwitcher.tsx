import { ChevronDown, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ActiveWorkspace } from "../../app/workspace-context";

/** Renders a text-width workspace selector with a native disclosure menu. */
export function WorkspaceSwitcher({
  workspace,
  workspaces,
  onWorkspaceChange,
  onWorkspaceRename,
}: {
  /** Currently active workspace displayed by the trigger. */
  workspace: ActiveWorkspace;
  /** Authorized workspaces displayed by the disclosure menu. */
  workspaces: ActiveWorkspace[];
  /** Activates one workspace selected from the menu. */
  onWorkspaceChange: (workspaceId: string) => void;
  /** Renames the active workspace when the data source supports it. */
  onWorkspaceRename?: (workspaceId: string, name: string) => Promise<void>;
}) {
  const { t } = useTranslation("home");
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const [draftName, setDraftName] = useState(workspace.title);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }

    setDraftName(workspace.title);
  }, [isEditing, workspace.title]);

  /** Activates the selected workspace and closes the native disclosure. */
  function handleWorkspaceClick(workspaceId: string) {
    onWorkspaceChange(workspaceId);
    detailsRef.current?.removeAttribute("open");
  }

  /** Opens the active workspace name in an all-selected input field. */
  function handleRenameStart() {
    detailsRef.current?.removeAttribute("open");
    setDraftName(workspace.title);
    setIsEditing(true);
  }

  /** Submits a non-empty workspace name once for Enter or focus loss. */
  async function handleRenameSubmit() {
    const name = draftName.trim();

    if (!onWorkspaceRename || !name || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSaving(true);
    try {
      await onWorkspaceRename(workspace.id, name);
      setIsEditing(false);
    } catch (error) {
      console.error("[zembra] Failed to rename workspace from the switcher", {
        error,
        workspaceId: workspace.id.slice(0, 8),
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-[var(--space-1)]">
      {isEditing ? (
        <input
          aria-invalid={!draftName.trim()}
          aria-label={t("workspace.nameInput")}
          className="min-w-0 border-0 bg-transparent p-0 text-lg font-bold text-[var(--color-text-primary)] outline-none"
          disabled={isSaving}
          ref={inputRef}
          value={draftName}
          onBlur={() => void handleRenameSubmit()}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleRenameSubmit();
            }
          }}
        />
      ) : (
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
      )}
      {onWorkspaceRename ? (
        <button
          aria-label={t("workspace.rename")}
          className="flex size-[var(--icon-hit-size)] shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          type="button"
          onClick={handleRenameStart}
        >
          <Pencil className="size-[var(--icon-size)]" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
