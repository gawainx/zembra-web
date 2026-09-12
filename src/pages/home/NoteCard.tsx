import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import { Bot, ChevronDown, MoreHorizontal, User } from "lucide-react";
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
import { formatNoteTimestamp, stripRenderedFieldMarker } from "./homeUtils";

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
  }

  /** Inserts this note as a valid mention into the active note draft. */
  function handleMentionClick() {
    onMention(note.id);
  }

  /** Enters edit mode from the card action menu when this card can own the draft. */
  function handleEditClick() {
    if (!isEditing && canStartEditing) {
      onEditStart(note);
    }
  }

  /** Changes this note to the selected field and closes the metadata menu. */
  function handleFieldSelect(nextFieldName: string) {
    if (nextFieldName === fieldName) {
      return;
    }

    onFieldChange(note, nextFieldName);
  }

  return (
    <article className="relative flex flex-col gap-[var(--space-1)] rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-[var(--space-3)] py-[var(--space-2)]">
      <div className="flex items-start justify-between gap-[var(--space-3)] text-[13px] text-[var(--color-text-muted)]">
        <div className="min-w-0 pr-[var(--note-card-header-actions-width)]">
          {formatNoteTimestamp(note.createdAt, locale)}
          {fieldName ? (
            <span className="ml-1 inline-flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="plain"
                    size="content"
                    aria-label={t("note.fieldMenu.switch", {
                      field: fieldName,
                    })}
                    className="inline-flex items-center gap-0.5 rounded-[var(--radius-control)] font-bold text-[var(--color-field)] hover:bg-[var(--color-field-soft)]"
                    disabled={isEditing || fields.length === 0}
                    type="button"
                  >
                    @{fieldName}
                    <ChevronDown className="size-3" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup
                    value={fieldName}
                    onValueChange={handleFieldSelect}
                  >
                    {fields.map((field) => (
                      <DropdownMenuRadioItem key={field.id} value={field.name}>
                        @{field.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <User
                className="size-[var(--icon-size)] shrink-0"
                aria-hidden="true"
              />
            ) : (
              <Bot
                className="size-[var(--icon-size)] shrink-0"
                aria-hidden="true"
              />
            )}
          </span>
          {!isEditing ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="plain"
                  size="icon"
                  type="button"
                  aria-label={t("note.actions")}
                  className="text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
                >
                  <MoreHorizontal
                    className="size-[var(--icon-size)]"
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={!canStartEditing}
                  onSelect={handleEditClick}
                >
                  {t("note.edit.action")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleMentionClick}>
                  {t("note.mention")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={handleDeleteClick}
                >
                  {t("note.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <Button
              variant="plain"
              size="content"
              className="self-start text-sm font-semibold text-[var(--color-accent)]"
              type="button"
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? t("note.collapse") : t("note.expand")}
            </Button>
          ) : null}
        </>
      )}
    </article>
  );
}
