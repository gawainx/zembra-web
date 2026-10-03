import { useLayoutEffect, useRef, type ComponentProps } from "react";
import { Button } from "../../components/ui/button";
import { useTranslation } from "react-i18next";
import type { NoteDto } from "../../api/types";
import { NoteCard } from "./NoteCard";

type CardProps = Omit<ComponentProps<typeof NoteCard>, "note" | "canStartEditing" | "isEditing" | "fieldName" | "editDraft" | "editWarning">;
export function HomeNoteFeed({ archived = false, loading = false, failed = false, hasKeyword = false, onRetry, visibleNotes, editingNoteId, editDraft, editWarning, fieldNameById, cardProps }: {
  archived?: boolean; loading?: boolean; failed?: boolean; hasKeyword?: boolean; onRetry?: () => void;
  visibleNotes: NoteDto[]; editingNoteId?: string; editDraft: string; editWarning?: string;
  fieldNameById: Map<string, string>; cardProps: CardProps;
}) {
  const { t } = useTranslation("home");
  const container = useRef<HTMLDivElement>(null);
  const focusAfterArchive = useRef(false);
  useLayoutEffect(() => {
    if (focusAfterArchive.current) { container.current?.focus(); focusAfterArchive.current = false; }
  }, [visibleNotes]);
  return (
    <div ref={container} tabIndex={-1} role="region" aria-label={t(archived ? "sidebar.archived" : "note.list")} className="min-h-0 flex-1 overflow-y-auto pb-44">
      <div className="flex flex-col gap-[var(--space-3)]">
        {visibleNotes.length === 0 && !(archived && (loading || failed)) ? (
          <article className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-5)] text-[var(--color-text-muted)]">
            {t(archived ? (hasKeyword ? "note.archiveNoMatch" : "note.archiveEmpty") : "note.empty")}
          </article>
        ) : null}
        {visibleNotes.map((note) => (
          <NoteCard
            canStartEditing={!editingNoteId || editingNoteId === note.id}
            editDraft={editingNoteId === note.id ? editDraft : undefined}
            editWarning={editingNoteId === note.id ? editWarning : undefined}
            {...cardProps}
            onArchiveChange={cardProps.onArchiveChange ? (id, value) => {
              focusAfterArchive.current = true;
              return cardProps.onArchiveChange!(id, value);
            } : undefined}
            fieldName={note.fieldId ? fieldNameById.get(note.fieldId) : undefined}
            isEditing={editingNoteId === note.id}
            key={note.id}
            note={note}
          />
        ))}
        {archived && loading ? <p role="status" className="text-sm text-[var(--color-text-muted)]">{t("note.archiveLoading")}</p> : null}
        {archived && failed ? <div role="alert" className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-text-muted)]">
          <span>{t("note.archiveLoadFailed")}</span>
          <Button className="whitespace-nowrap" onClick={onRetry}>{t("note.archiveRetry")}</Button>
        </div> : null}
      </div>
    </div>
  );
}
