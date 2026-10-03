import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { NoteDto } from "../../api/types";
import { NoteCard } from "./NoteCard";

type CardProps = Omit<ComponentProps<typeof NoteCard>, "note" | "canStartEditing" | "isEditing" | "fieldName" | "editDraft" | "editWarning">;
export function HomeNoteFeed({ visibleNotes, editingNoteId, editDraft, editWarning, fieldNameById, cardProps }: {
  visibleNotes: NoteDto[]; editingNoteId?: string; editDraft: string; editWarning?: string;
  fieldNameById: Map<string, string>; cardProps: CardProps;
}) {
  const { t } = useTranslation("home");
  return (          <div className="min-h-0 flex-1 overflow-y-auto pb-44">
            <div className="flex flex-col gap-[var(--space-3)]">
              {visibleNotes.length === 0 ? (
                <article className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-5)] text-[var(--color-text-muted)]">
                  {t("note.empty")}
                </article>
              ) : null}
              {visibleNotes.map((note) => (
                <NoteCard
                  canStartEditing={!editingNoteId || editingNoteId === note.id}
                  editDraft={editingNoteId === note.id ? editDraft : undefined}
                  editWarning={editingNoteId === note.id ? editWarning : undefined}
                  {...cardProps}
                  fieldName={note.fieldId ? fieldNameById.get(note.fieldId) : undefined}
                  isEditing={editingNoteId === note.id}
                  key={note.id}
                  note={note}
                />
              ))}
            </div>
          </div>);
}
