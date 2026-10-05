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

