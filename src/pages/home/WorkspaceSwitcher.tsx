import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Check, ChevronDown, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ActiveWorkspace } from "../../app/workspace-context";

/** Renders a text-width workspace selector with a shadcn dropdown menu. */
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
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draftName, setDraftName] = useState(workspace.title);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }

    setDraftName(workspace.title);
  }, [isEditing, workspace.title]);

  /** Activates the selected workspace and closes the menu. */
  function handleWorkspaceClick(workspaceId: string) {
    onWorkspaceChange(workspaceId);
    setMenuOpen(false);
  }

  /** Opens the active workspace name in an all-selected input field. */
  function handleRenameStart() {
    setMenuOpen(false);
    setDraftName(workspace.title);
    setIsEditing(true);
  }

  /** Optimistically submits a non-empty workspace name for Enter or focus loss. */
  function handleRenameSubmit() {
    const name = draftName.trim();

    if (!onWorkspaceRename || !name) {
      return;
    }

    void onWorkspaceRename(workspace.id, name);
    setIsEditing(false);
  }

  return (
    <div className="flex min-w-0 items-center gap-[var(--space-1)]">
      {isEditing ? (
        <Input
          aria-invalid={!draftName.trim()}
          aria-label={t("workspace.nameInput")}
          className="min-w-0 border-0 bg-transparent p-0 text-lg font-bold text-[var(--color-text-primary)] outline-none"
          ref={inputRef}
          value={draftName}
          onBlur={handleRenameSubmit}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleRenameSubmit();
            }
          }}
        />
      ) : (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="plain"
              size="content"
              type="button"
              className="gap-0 text-lg font-bold text-[var(--color-text-primary)]"
            >
              <span>{workspace.name}</span>
              <ChevronDown
                className="size-[var(--icon-size)]"
                aria-hidden="true"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={workspace.id}
              onValueChange={handleWorkspaceClick}
            >
              {workspaces.map((option) => (
                <DropdownMenuRadioItem key={option.id} value={option.id}>
                  {option.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {onWorkspaceRename ? (
        <Button
          variant="plain"
          size="content"
          aria-label={isEditing ? t("workspace.save") : t("workspace.rename")}
          className="flex size-[var(--icon-hit-size)] shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={() => {
            if (isEditing) {
              handleRenameSubmit();
              return;
            }

            handleRenameStart();
          }}
        >
          {isEditing ? (
            <Check className="size-[var(--icon-size)]" aria-hidden="true" />
          ) : (
            <Pencil className="size-[var(--icon-size)]" aria-hidden="true" />
          )}
        </Button>
      ) : null}
    </div>
  );
}
