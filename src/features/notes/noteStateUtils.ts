import type { DailyNoteCount, NoteDto } from "../../api/types";

export interface NoteCollections {
  notes: NoteDto[];
  archivedNotes: NoteDto[];
  roleNavigationNotes: NoteDto[];
  notePreviewById: Record<string, NoteDto>;
  dailyNoteCounts: DailyNoteCount[];
  selectedRole?: string;
}

/** Orders notes consistently across pages, optimistic moves, and restoration. */
export function orderNotes(notes: NoteDto[]): NoteDto[] {
  return [...notes].sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
}

export function isActiveNote(note: NoteDto | null | undefined): note is NoteDto {
  return Boolean(note && note.archivedAt == null);
}

/** Projects one lifecycle change without restoring stale whole-list snapshots. */
export function projectNote(state: NoteCollections, id: string, previous: NoteDto | null, next: NoteDto | null): NoteCollections {
  const replace = (items: NoteDto[], include: boolean, limit?: number) => {
    const remaining = items.filter((note) => note.id !== id);
    return orderNotes(include && next ? [...remaining, next] : remaining).slice(0, limit);
  };
  const previews = { ...state.notePreviewById };
  if (next) previews[id] = next;
  if (!next) delete previews[id];
  const timestamp = (next ?? previous)?.createdAt;
  const date = timestamp === undefined ? undefined : new Date(timestamp * 1000).toISOString().slice(0, 10);
  const delta = Number(isActiveNote(next)) - Number(isActiveNote(previous));
  return {
    ...state,
    notes: replace(state.notes, isActiveNote(next) && (!state.selectedRole || next.role === state.selectedRole), 50),
    roleNavigationNotes: replace(state.roleNavigationNotes, isActiveNote(next), 50),
    archivedNotes: replace(state.archivedNotes, Boolean(next && next.archivedAt != null)),
    notePreviewById: previews,
    dailyNoteCounts: delta ? state.dailyNoteCounts.map((day) => day.date === date ? { ...day, count: Math.max(0, day.count + delta) } : day) : state.dailyNoteCounts,
  };
}

export interface NoteIntent { patch: Partial<NoteDto> | null }
export interface NoteMutation {
  confirmed: NoteDto | null;
  intents: NoteIntent[];
  queue: Promise<void>;
  epoch: number;
}

/** Replays only unconfirmed field changes on the last server-confirmed record. */
export function projectedMutation(mutation: NoteMutation): NoteDto | null {
  return mutation.intents.reduce<NoteDto | null>((note, intent) =>
    intent.patch && note ? { ...note, ...intent.patch } : null, mutation.confirmed);
}

/** Reconciles a read with writes that happened during it or are still pending. */
export function overlayNotes(notes: NoteDto[], mutations: Map<string, NoteMutation> | undefined, since: number): NoteDto[] {
  const result = new Map(notes.map((note) => [note.id, note]));
  mutations?.forEach((mutation, id) => {
    if (!mutation.intents.length && mutation.epoch <= since) return;
    const note = projectedMutation(mutation);
    if (note) result.set(id, note);
    else result.delete(id);
  });
  return orderNotes([...result.values()]);
}
