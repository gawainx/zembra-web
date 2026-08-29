import { SendHorizontal } from "lucide-react";
import {
  forwardRef,
  KeyboardEvent,
  lazy,
  MouseEvent,
  Suspense,
  useImperativeHandle,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import type { TagDto } from "../../api/types";
import type { LiveMarkdownEditorHandle } from "./LiveMarkdownEditor";
import type { ComposerTool } from "./homeTypes";

/** Loads the Tiptap editor only when a note editor is rendered. */
const LiveMarkdownEditor = lazy(async () => ({
  default: (await import("./LiveMarkdownEditor")).LiveMarkdownEditor,
}));

export interface NoteEditorHandle {
  /** Clears the visible editor content after a successful submission. */
  clear: () => void;
}

/** Renders a reusable note text editor shared by creation and card editing. */
export const NoteEditor = forwardRef<
  NoteEditorHandle,
  {
  draft: string;
  isSubmitting: boolean;
  meta?: string;
  onCancel?: () => void;
  onDraftChange: (draft: string) => void;
  placeholder: string;
  submitLabel: string;
  tags: TagDto[];
  tools: ComposerTool[];
  variant: "floating" | "embedded";
  warning?: string;
  }
>(function NoteEditor(
  {
    draft,
    isSubmitting,
    meta,
    onCancel,
    onDraftChange,
    placeholder,
    submitLabel,
    tags,
    tools,
    variant,
    warning,
  },
  ref,
) {
  const { t } = useTranslation("home");
  const editorRef = useRef<LiveMarkdownEditorHandle>(null);

  useImperativeHandle(
    ref,
    () => ({
      clear() {
        editorRef.current?.clear();
      },
    }),
    [],
  );

  /** Handles keyboard shortcuts scoped to this editor. */
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && onCancel) {
      event.preventDefault();
      onCancel();
    }
  }

  /** Inserts a toolbar snippet into this editor's draft. */
  function handleToolClick(
    event: MouseEvent<HTMLButtonElement>,
    tool: ComposerTool,
  ) {
    event.preventDefault();
    editorRef.current?.applyTool(tool);
  }

  return (
    <div
      className={[
        "flex flex-col gap-[var(--space-2)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)]",
        variant === "floating"
          ? "shadow-[var(--color-shadow-float)] backdrop-blur"
          : "shadow-none",
      ].join(" ")}
      onKeyDown={handleKeyDown}
    >
      <Suspense
        fallback={
          <div
            aria-busy="true"
            className="min-h-[70px] px-[var(--space-4)] py-[var(--space-3)] text-sm text-[var(--color-text-muted)]"
            role="status"
          >
            {t("composer.editorLoading")}
          </div>
        }
      >
        <LiveMarkdownEditor
          disabled={isSubmitting}
          placeholder={placeholder}
          value={draft}
          tags={tags}
          variant={variant}
          ref={editorRef}
          onChange={onDraftChange}
        />
      </Suspense>
      {warning ? (
        <div className="mx-[var(--space-4)] rounded-[var(--radius-control)] border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--color-warning)]">
          {warning}
        </div>
      ) : null}
      <div className="flex items-end justify-between gap-[var(--space-3)] px-[var(--space-4)] pb-[var(--space-3)]">
        <div className="min-w-0">
          <div className="flex items-center gap-4 text-[var(--color-text-secondary)]">
            {tools.map((tool) => (
              <button
                className="flex size-[var(--icon-hit-size)] items-center justify-center rounded-[var(--radius-control)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
                key={tool.id}
                type="button"
                aria-label={tool.label}
                title={tool.label}
                onClick={(event) => handleToolClick(event, tool)}
              >
                {tool.icon}
              </button>
            ))}
          </div>
          {meta ? (
            <div className="mt-1.5 truncate text-xs text-[var(--color-text-muted)]">
              {meta}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onCancel ? (
            <button
              className="h-[34px] rounded-[10px] px-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
              type="button"
              onClick={onCancel}
            >
              {t("note.edit.cancel")}
            </button>
          ) : null}
          <button
            className="flex size-[var(--icon-hit-size)] items-center justify-center text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            aria-label={submitLabel}
            disabled={isSubmitting || draft.trim().length === 0}
          >
            <SendHorizontal className="size-5" fill="currentColor" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
});
