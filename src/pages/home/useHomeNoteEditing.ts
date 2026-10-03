import { useLayoutEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { defaultFieldName } from "../../api/defaultField";
import type { NoteDto, UpdateNoteInput } from "../../api/types";
import { normalizeMarkdownSource } from "./liveMarkdownEditorUtils";
import { parseFieldNames, parseNoteLinks, parseTagNames } from "./homeUtils";

/** Keeps one card draft across feed switches and clears it when the workspace changes. */
export function useHomeNoteEditing({ workspaceId, notes, fieldNameById, updateNote, setComposerDraft }: {
  workspaceId: string;
  notes: NoteDto[];
  fieldNameById: Map<string, string>;
  updateNote: (id: string, input: UpdateNoteInput) => Promise<void>;
  setComposerDraft: Dispatch<SetStateAction<string>>;
}) {
  const { t } = useTranslation("home");
  const [editingNoteId, setEditingNoteId] = useState<string>();
  const [editDraft, setEditDraft] = useState("");
  useLayoutEffect(() => {
    setEditingNoteId(undefined);
    setEditDraft("");
  }, [workspaceId]);
  const editFieldNames = useMemo(() => parseFieldNames(editDraft), [editDraft]);
  const editWarning =
    editFieldNames.length > 1
      ? t("note.edit.warningMultipleFields", { field: editFieldNames[0] })
      : undefined;
  /** Starts editing a note when no other card owns a draft. */
  function handleEditStart(note: NoteDto) {
    if (editingNoteId && editingNoteId !== note.id) {
      return;
    }

    setEditingNoteId(note.id);
    setEditDraft(normalizeMarkdownSource(note.content));
  }

  /** Cancels the current note edit draft. */
  function handleEditCancel() {
    setEditingNoteId(undefined);
    setEditDraft("");
  }

  /** Inserts a note mention into the active editor draft. */
  function handleMentionNote(noteId: string) {
    const mention = `[[${noteId}]]`;

    if (editingNoteId) {
      setEditDraft((current) =>
        current.trim().length > 0 ? `${current} ${mention}` : mention,
      );
      return;
    }

    setComposerDraft((current) =>
      current.trim().length > 0 ? `${current} ${mention}` : mention,
    );
  }

  /** Optimistically persists the current edit draft and immediately exits edit mode. */
  function handleEditSubmit() {
    if (!editingNoteId) {
      return;
    }

    const content = editDraft.trim();

    if (!content) {
      return;
    }

    const fieldNames = parseFieldNames(content);

    const existingFieldName = fieldNameById.get(
      notes.find((note) => note.id === editingNoteId)?.fieldId ?? "",
    );

    void updateNote(editingNoteId, {
      content,
      field: fieldNames[0] ?? existingFieldName ?? defaultFieldName,
      links: parseNoteLinks(content),
      tags: parseTagNames(content),
    });
    handleEditCancel();
  }

  /** Persists a field-only change for one note without changing navigation filters. */
  function handleNoteFieldChange(note: NoteDto, field: string) {
    void updateNote(note.id, {
      content: note.content,
      field,
      links: parseNoteLinks(note.content),
      tags: parseTagNames(note.content),
    });
  }

  return { editingNoteId, editDraft, editWarning, setEditDraft, handleEditStart, handleEditCancel,
    handleMentionNote, handleEditSubmit, handleNoteFieldChange };
}
