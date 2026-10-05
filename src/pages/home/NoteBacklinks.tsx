import { useEffect, useId, useState } from "react";
import { ArrowDownRight, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { NoteDto } from "../../api/types";
import { Button } from "../../components/ui/button";
import { useNotesStore } from "../../features/notes/noteStore";
import { noteBacklinkExcerpt } from "../../features/notes/noteLinkUtils";
import { NoteLinkPreview } from "./NoteLinkPreview";

const emptyNotes: NoteDto[] = [];

/** Shows incoming sources independently of the feed's current filters. */
export function NoteBacklinks({ noteId, locale, onLoadNotePreview }: {
  noteId: string;
  locale?: string;
  onLoadNotePreview: (noteId: string) => Promise<NoteDto>;
}) {
  const { t } = useTranslation("home");
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const sources = useNotesStore((state) => state.backlinksByNoteId[noteId] ?? emptyNotes);
  const status = useNotesStore((state) => state.backlinkStatus[noteId]);
  const scope = useNotesStore((state) => state.scopeClient);
  const load = useNotesStore((state) => state.loadBacklinks);
  useEffect(() => { void load(noteId); }, [load, noteId, scope]);
  useEffect(() => { setExpanded(false); }, [noteId, scope]);
  if (!sources.length && status !== "loading" && status !== "error") return null;
  const label = t("note.backlinks.count", { count: sources.length });
  return (
    <div className="mt-2 min-w-0 text-sm text-[var(--color-text-muted)]">
      {status === "loading" ? <p role="status">{t("note.backlinks.loading")}</p> : null}
      {status === "error" ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2">
          <span>{t("note.backlinks.failed")}</span>
          <Button variant="plain" size="content" className="whitespace-nowrap" onClick={() => void load(noteId, true)}>{t("note.backlinks.retry")}</Button>
        </div>
      ) : null}
      {sources.length ? <>
        {sources.length > 2 ? (
          <Button variant="plain" size="content" className="inline-flex items-center gap-2 whitespace-nowrap" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded((value) => !value)}>
            {label}{expanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
          </Button>
        ) : <p>{label}</p>}
        <ul id={listId} aria-label={label} className="mt-2 flex min-w-0 flex-col gap-2">
          {(expanded ? sources : sources.slice(0, 2)).map((source) => (
            <li key={source.id} className="min-w-0">
              <NoteLinkPreview noteRef={source.id} source={source} onLoadNotePreview={onLoadNotePreview}>
                <ArrowDownRight size={14} className="shrink-0" aria-hidden="true" />
                <span className="min-w-0 truncate">
                  <time dateTime={new Date(source.createdAt * 1000).toISOString()}>{new Date(source.createdAt * 1000).toLocaleDateString(locale)}</time>
                  {": "}{noteBacklinkExcerpt(source.content)}
                </span>
              </NoteLinkPreview>
            </li>
          ))}
        </ul>
      </> : null}
    </div>
  );
}
