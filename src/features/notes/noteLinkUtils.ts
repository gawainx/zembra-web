import type { NoteLinkInput } from "../../api/types";

/** Matches complete non-whitespace note IDs inside Zembra double-bracket references. */
export const fullNoteLinkPattern = /\[\[([^\[\]\s]+)\]\]/g;

/** Extracts full UUID note links from note content for backend submission. */
export function parseNoteLinks(content: string): NoteLinkInput[] {
  return Array.from(content.matchAll(fullNoteLinkPattern), (match) => ({
    anchorText: match[0],
    position: match.index ?? null,
    targetNoteRef: match[1],
  }));
}

/** Returns whether a source contains a reference to another note. */
export function referencesNote(content: string, sourceId: string, targetId: string): boolean {
  return sourceId !== targetId && parseNoteLinks(content).some((link) => link.targetNoteRef === targetId);
}

/** Takes a deterministic prefix without splitting Unicode code points. */
export function noteBacklinkExcerpt(content: string): string {
  const characters = Array.from(content.replace(/\r\n|[\r\n]/g, " "));
  return characters.slice(0, 120).join("") + (characters.length > 120 ? "…" : "");
}
