import { Bot, Check, ChevronDown, MoreHorizontal, User } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { FieldDto, NoteDto, TagDto } from "../../api/types";
import { NoteEditor } from "./NoteEditor";
import { NoteMarkdownContent } from "./NoteMarkdownContent";
import type { ComposerTool } from "./homeTypes";
import {
  formatNoteTimestamp,
  stripRenderedFieldMarker,
} from "./homeUtils";

/** Renders one recent note in the home feed. */
export function NoteCard({
  canStartEditing,
  editDraft,
  editWarning,
  fields,
  fieldName,
  isEditing,
  locale,
  note,
  onDelete,
  onEditCancel,
  onEditDraftChange,
  onEditStart,
  onEditSubmit,
  onFieldChange,
  onLoadNotePreview,
  onMention,
  tags,
  tools,
}: {
  canStartEditing: boolean;
  editDraft?: string;
  editWarning?: string;
  fields: FieldDto[];
  fieldName?: string;
  isEditing: boolean;
  locale?: string;
  note: NoteDto;
  onDelete: (noteId: string) => Promise<void>;
  onEditCancel: () => void;
  onEditDraftChange: (draft: string) => void;
  onEditStart: (note: NoteDto) => void;
  onEditSubmit: () => void;
  onFieldChange: (note: NoteDto, fieldName: string) => void;
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>;
  onMention: (noteId: string) => void;
  tags: TagDto[];
  tools: ComposerTool[];
}) {
  const { t } = useTranslation("home");
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isFieldMenuOpen, setIsFieldMenuOpen] = useState(false);
  const displayRole = note.role || t("sidebar.unknownRole");
  const displayContent = useMemo(
    () => stripRenderedFieldMarker(note.content, fieldName),
    [fieldName, note.content],
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const measureOverflow = useCallback(() => {
    const element = contentRef.current;

    if (!element) {
      return;
    }

    setHasOverflow(element.scrollHeight > element.clientHeight + 1);
  }, []);

  useLayoutEffect(() => {
    measureOverflow();
  }, [displayContent, fieldName, measureOverflow, note.tags]);

  useEffect(() => {
    window.addEventListener("resize", measureOverflow);

    return () => window.removeEventListener("resize", measureOverflow);
  }, [measureOverflow]);

  /** Starts deletion immediately and lets the store restore the note on failure. */
  function handleDeleteClick() {
    void onDelete(note.id).catch(() => undefined);
    setIsActionsOpen(false);
  }

  /** Inserts this note as a valid mention into the active note draft. */
  function handleMentionClick() {
    onMention(note.id);
    setIsActionsOpen(false);
  }

  /** Enters edit mode when this card is allowed to own the draft. */
  function handleDoubleClick() {
    if (!isEditing && canStartEditing) {
      onEditStart(note);
    }
  }

  /** Changes this note to the selected field and closes the metadata menu. */
  function handleFieldSelect(nextFieldName: string) {
    if (nextFieldName === fieldName) {
      setIsFieldMenuOpen(false);
      return;
    }

    onFieldChange(note, nextFieldName);
    setIsFieldMenuOpen(false);
  }

  return (
    <article
      className="relative flex flex-col gap-[var(--space-1)] rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-[var(--space-3)] py-[var(--space-2)]"
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex items-start justify-between gap-[var(--space-3)] text-[13px] text-[var(--color-text-muted)]">
        <div className="min-w-0 pr-[var(--note-card-header-actions-width)]">
          {formatNoteTimestamp(note.createdAt, locale)}
          {fieldName ? (
            <span className="relative ml-1 inline-flex">
              <button
                aria-expanded={isFieldMenuOpen}
                aria-label={t("note.fieldMenu.switch", { field: fieldName })}
                className="inline-flex items-center gap-0.5 rounded-[6px] font-bold text-[var(--color-field)] hover:bg-[var(--color-field-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isEditing || fields.length === 0}
                onClick={() => setIsFieldMenuOpen((current) => !current)}
                type="button"
              >
                @{fieldName}
                <ChevronDown className="size-3" aria-hidden="true" />
              </button>
              {isFieldMenuOpen ? (
                <div
                  className="absolute left-0 top-6 z-40 inline-flex w-max flex-col overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--color-shadow-float)]"
                  role="menu"
                >
                  {fields.map((field) => {
                    const selected = field.name === fieldName;

                    return (
                      <button
                        aria-checked={selected}
                        className="flex self-stretch items-center justify-between gap-2 whitespace-nowrap rounded-[6px] px-1.5 py-1 text-left text-[13px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                        key={field.id}
                        onClick={() => handleFieldSelect(field.name)}
                        role="menuitemradio"
                        type="button"
                      >
                        <span>@{field.name}</span>
                        {selected ? (
                          <Check className="size-4 text-[var(--color-field)]" aria-hidden="true" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </span>
          ) : null}
        </div>
        <div className="absolute right-[var(--space-3)] top-[var(--space-2)] flex items-start gap-[var(--space-2)]">
          <span
            aria-label={t("note.roleLabel", { role: displayRole })}
            className="inline-flex size-[var(--icon-size)] items-center justify-center text-[var(--color-accent)]"
            title={displayRole}
          >
            {note.role === "Human" ? (
              <User className="size-[var(--icon-size)] shrink-0" aria-hidden="true" />
            ) : (
              <Bot className="size-[var(--icon-size)] shrink-0" aria-hidden="true" />
            )}
          </span>
          {!isEditing ? (
            <div className="relative shrink-0">
            <button
              aria-expanded={isActionsOpen}
              aria-label={t("note.actions")}
              className="flex size-[var(--icon-hit-size)] items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
              onClick={() => setIsActionsOpen((current) => !current)}
              type="button"
            >
              <MoreHorizontal className="size-[var(--icon-size)]" aria-hidden="true" />
            </button>
            {isActionsOpen ? (
              <div className="absolute right-0 top-9 z-30 min-w-28 overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--color-shadow-float)]">
                <button
                  className="block w-full px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
                  onClick={handleMentionClick}
                  type="button"
                >
                  {t("note.mention")}
                </button>
                <button
                  className="block w-full px-3 py-2 text-left text-sm text-[var(--color-error)] hover:bg-[var(--color-error-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleDeleteClick}
                  type="button"
                >
                  {t("note.delete")}
                </button>
              </div>
            ) : null}
          </div>
          ) : null}
        </div>
      </div>
      {isEditing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onEditSubmit();
          }}
        >
          <NoteEditor
            draft={editDraft ?? ""}
            isSubmitting={false}
            placeholder={t("composer.placeholder")}
            submitLabel={t("composer.send")}
            tags={tags}
            tools={tools}
            variant="embedded"
            warning={editWarning}
            onCancel={onEditCancel}
            onDraftChange={onEditDraftChange}
          />
        </form>
      ) : (
        <>
          <div
            className="overflow-hidden text-base leading-6 text-[var(--color-text-primary)]"
            ref={contentRef}
            style={expanded ? undefined : { maxHeight: "5.25rem" }}
          >
            <NoteMarkdownContent
              content={displayContent}
              onLoadNotePreview={onLoadNotePreview}
            />
          </div>
          {hasOverflow || expanded ? (
            <button
              className="self-start text-sm font-semibold text-[var(--color-accent)]"
              type="button"
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? t("note.collapse") : t("note.expand")}
            </button>
          ) : null}
        </>
      )}
    </article>
  );
}
