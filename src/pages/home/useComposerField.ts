import { useEffect, useMemo } from "react";
import type { FieldDto, NoteDto } from "../../api/types";
import { defaultFieldName } from "../../api/defaultField";
import { parseFieldNames, parseNoteLinks } from "./homeUtils";

/** Resolves the creation field from explicit text, the first reference, and navigation. */
export function useComposerField({
  draft, fields, notes, cachedNotes, selectedField, workspaceId, loadNote,
}: {
  draft: string;
  fields: FieldDto[];
  notes: NoteDto[];
  cachedNotes: Record<string, NoteDto>;
  selectedField?: string;
  workspaceId: string;
  loadNote: (noteRef: string) => Promise<NoteDto>;
}) {
  const explicitField = parseFieldNames(draft)[0];
  const firstRef = parseNoteLinks(draft)[0]?.targetNoteRef;
  const knownNote = notes.find((note) => note.id === firstRef) ?? cachedNotes[firstRef ?? ""];
  const fallback = fields.find((field) => field.id === selectedField)?.name ?? defaultFieldName;
  const referencedField = knownNote
    ? fields.find((field) => field.id === knownNote.fieldId)?.name ?? defaultFieldName
    : undefined;

  // One request per first reference; unrelated typing never restarts the lookup.
  const lookup = useMemo(() => {
    if (explicitField || !firstRef || knownNote) return undefined;
    return { noteRef: firstRef, promise: undefined as Promise<NoteDto | undefined> | undefined };
  }, [explicitField, firstRef, knownNote, workspaceId]);

  function startLookup() {
    if (!lookup) return undefined;
    if (!lookup.promise) {
      console.info("[zembra] Loading referenced note field", { noteRef: lookup.noteRef, workspaceId });
      lookup.promise = loadNote(lookup.noteRef).then((note) => {
        console.info("[zembra] Loaded referenced note field", { noteRef: lookup.noteRef, workspaceId });
        return note;
      }).catch((error: unknown) => {
        console.warn("[zembra] Failed to load referenced note field", { noteRef: lookup.noteRef, workspaceId, error });
        return undefined;
      });
    }
    return lookup.promise;
  }

  useEffect(() => {
    // loadNote publishes successful reads into the existing preview cache.
    void startLookup();
  }, [lookup]);

  return {
    field: explicitField ?? referencedField ?? fallback,
    async resolveField() {
      if (explicitField || referencedField || !lookup) {
        return explicitField ?? referencedField ?? fallback;
      }
      const note = await startLookup();
      return note ? fields.find((field) => field.id === note.fieldId)?.name ?? defaultFieldName : fallback;
    },
  };
}
