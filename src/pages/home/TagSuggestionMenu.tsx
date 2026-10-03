import { useEffect, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { Button } from "../../components/ui/button";
import type { TagSuggestion } from "./liveMarkdownEditorUtils";

/** Displays tag candidates while keyboard focus stays in the editor. */
export function TagSuggestionMenu({ id, options, activeIndex, left, top, anchorTop, onSelect }: {
  id: string;
  options: TagSuggestion[];
  activeIndex: number;
  left: number;
  top: number;
  anchorTop: number;
  onSelect: (option: TagSuggestion) => void;
}) {
  const { t } = useTranslation("home");
  const activeOption = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = menu.current;
    if (!element) return;
    const reposition = () => {
      const height = element.getBoundingClientRect().height;
      const nextTop = top + height > window.innerHeight - 8
        ? Math.max(8, anchorTop - height - 6)
        : top;
      element.style.top = `${nextTop}px`;
    };
    reposition();
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [top, anchorTop, options]);

  useEffect(() => {
    activeOption.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return createPortal(
    <div
      id={id}
      ref={menu}
      className="fixed z-50 max-h-[min(14rem,calc(100dvh-16px))] w-64 max-w-[calc(100vw-16px)] overflow-y-auto rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-1 shadow-[var(--color-shadow-float)]"
      role="listbox"
      style={{ left: `${Math.max(8, left)}px`, top: `${top}px` }}
    >
      {options.map((option, index) => (
        <Button
          variant="plain"
          size="content"
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] aria-selected:bg-[var(--color-surface-muted)]"
          key={`${option.type}-${option.path}`}
          id={`${id}-${index}`}
          ref={index === activeIndex ? activeOption : undefined}
          role="option"
          aria-selected={index === activeIndex}
          tabIndex={-1}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(option)}
        >
          <span>{option.type === "create"
            ? t("composer.tagSuggestion.create", { tag: option.path })
            : option.label}</span>
        </Button>
      ))}
    </div>,
    document.body,
  );
}
