import { Button } from "../../components/ui/button";
import { useTranslation } from "react-i18next";
import { useRef, useState, type ReactNode } from "react";
import type { NoteDto } from "../../api/types";
import { formatShortNoteRef } from "./homeUtils";
import { NoteMarkdownContent } from "./NoteMarkdownContent";

export function NoteLinkPreview({
  noteRef,
  onLoadNotePreview,
}: {
  noteRef: string;
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>;
}) {
  const { t } = useTranslation("home");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<NoteDto>();
  const [hasError, setHasError] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ left: 0, top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  /** Loads preview content when the user inspects this note reference. */
  async function handlePreviewOpen() {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (rect) {
      setPreviewPosition({
        left: Math.min(rect.left, window.innerWidth - 304),
        top: rect.bottom + 6,
      });
    }

    setIsOpen(true);

    if (preview || isLoading) {
      return;
    }

    setIsLoading(true);
    setHasError(false);
    try {
      setPreview(await onLoadNotePreview(noteRef));
    } catch (error) {
      console.error("Failed to load note link preview", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  /** Hides the hover preview without clearing cached content. */
  function handlePreviewClose() {
    setIsOpen(false);
  }

  return (
    <span className="relative inline-flex">
      <Button variant="plain" size="content"
        aria-label={t("note.linkPreview.label", {
          id: formatShortNoteRef(noteRef),
        })}
        className="mx-0.5 inline-flex h-[24px] items-center rounded-[7px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1.5 text-[13px] font-semibold text-[var(--color-accent)] hover:border-[var(--color-accent)]"
        onBlur={handlePreviewClose}
        onFocus={() => void handlePreviewOpen()}
        onMouseEnter={() => void handlePreviewOpen()}
        onMouseLeave={handlePreviewClose}
        ref={buttonRef}
        type="button"
      >
        {formatShortNoteRef(noteRef)}
      </Button>
      {isOpen ? (
        <div
          className="fixed z-40 block w-72 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-left text-sm leading-6 text-[var(--color-text-primary)] shadow-[var(--color-shadow-float)]"
          style={{
            left: `${Math.max(8, previewPosition.left)}px`,
            top: `${previewPosition.top}px`,
          }}
        >
          {renderPreviewContent({
            hasError,
            isLoading,
            loadingLabel: t("note.linkPreview.loading"),
            previewContent: preview?.content,
            onLoadNotePreview,
            unavailableLabel: t("note.linkPreview.unavailable"),
          })}
        </div>
      ) : null}
    </span>
  );
}

/** Returns the visible text for the note-link preview bubble. */
function renderPreviewContent({
  hasError,
  isLoading,
  loadingLabel,
  onLoadNotePreview,
  previewContent,
  unavailableLabel,
}: {
  hasError: boolean;
  isLoading: boolean;
  loadingLabel: string;
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>;
  previewContent?: string;
  unavailableLabel: string;
}): ReactNode {
  if (isLoading) {
    return loadingLabel;
  }

  if (hasError) {
    return unavailableLabel;
  }

  return previewContent !== undefined ? (
    <NoteMarkdownContent
      content={previewContent}
      onLoadNotePreview={onLoadNotePreview}
    />
  ) : (
    unavailableLabel
  );
}
