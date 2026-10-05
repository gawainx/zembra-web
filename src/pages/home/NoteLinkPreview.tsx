import { createPortal } from "react-dom";
import { Button } from "../../components/ui/button";
import { useTranslation } from "react-i18next";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { NoteDto } from "../../api/types";
import { formatShortNoteRef } from "./homeUtils";
import { NoteMarkdownContent } from "./NoteMarkdownContent";

export function NoteLinkPreview({
  noteRef,
  source,
  children,
  onLoadNotePreview,
}: {
  noteRef: string;
  source?: NoteDto;
  children?: ReactNode;
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>;
}) {
  const previewId = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  const { t } = useTranslation("home");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<NoteDto>();
  const [hasError, setHasError] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ left: 0, top: 0, bottom: 0, above: false, availableHeight: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  /** Loads preview content when the user inspects this note reference. */
  async function handlePreviewOpen() {
    clearTimeout(closeTimer.current);
    const rect = buttonRef.current?.getBoundingClientRect();

    if (rect) {
      const above = Boolean(source && window.innerHeight - rect.bottom < 200 && rect.top > window.innerHeight - rect.bottom);
      setPreviewPosition({
        left: Math.min(rect.left, window.innerWidth - 304),
        top: rect.bottom + 6,
        bottom: window.innerHeight - rect.top + 6,
        above,
        availableHeight: Math.max(80, (above ? rect.top : window.innerHeight - rect.bottom) - 14),
      });
    }

    setIsOpen(true);

    if (source || preview || isLoading) {
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
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setIsOpen(false), 120);
  }

  return (
    <span className={source ? "relative flex min-w-0" : "relative inline-flex"}>
      <Button variant="plain" size="content"
        aria-describedby={isOpen ? previewId : undefined}
        aria-label={children ? undefined : t("note.linkPreview.label", {
          id: formatShortNoteRef(noteRef),
        })}
        className={source ? "flex w-full min-w-0 items-center gap-2 text-left text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" : "mx-0.5 inline-flex h-[24px] items-center rounded-[7px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1.5 text-[13px] font-semibold text-[var(--color-accent)] hover:border-[var(--color-accent)]"}
        onBlur={handlePreviewClose}
        onKeyDown={(event) => { if (event.key === "Escape") { clearTimeout(closeTimer.current); setIsOpen(false); } }}
        onFocus={() => void handlePreviewOpen()}
        onMouseEnter={() => void handlePreviewOpen()}
        onMouseLeave={handlePreviewClose}
        ref={buttonRef}
        type="button"
      >
        {children ?? formatShortNoteRef(noteRef)}
      </Button>
      {isOpen ? createPortal(
        <div
          id={previewId}
          role="tooltip"
          onMouseEnter={() => clearTimeout(closeTimer.current)}
          onMouseLeave={handlePreviewClose}
          className="fixed z-40 block max-h-[60vh] w-72 max-w-[calc(100vw-16px)] overflow-auto rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-left text-sm leading-6 text-[var(--color-text-primary)] shadow-[var(--color-shadow-float)]"
          style={{
            left: `${Math.max(8, previewPosition.left)}px`,
            top: previewPosition.above ? undefined : `${previewPosition.top}px`,
            bottom: previewPosition.above ? `${previewPosition.bottom}px` : undefined,
            maxHeight: source ? `min(60vh, ${previewPosition.availableHeight}px)` : undefined,
          }}
        >
          {renderPreviewContent({
            hasError,
            isLoading,
            loadingLabel: t("note.linkPreview.loading"),
            previewContent: source?.content ?? preview?.content,
            onLoadNotePreview,
            unavailableLabel: t("note.linkPreview.unavailable"),
          })}
        </div>, document.body
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
