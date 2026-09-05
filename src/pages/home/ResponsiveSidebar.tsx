import { Menu, X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/** Keeps the sidebar in the desktop grid and opens it as a narrow-screen drawer. */
export function ResponsiveSidebar({ header, children }: { header: ReactNode; children: ReactNode }) {
  const { t } = useTranslation("home");
  const [headerHeight, setHeaderHeight] = useState(0);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (media.matches) setOpen(false); };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;
    toggleRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key === "Tab") {
        const controls = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) ?? []).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-col" style={open ? { minHeight: headerHeight } : undefined}>
      {open && <button type="button" tabIndex={-1} aria-label={t("sidebar.closeOutside")}
        className="fixed inset-0 z-30 bg-[var(--color-overlay)] lg:hidden" onClick={close} />}
      <aside ref={sidebarRef} role={open ? "dialog" : undefined} aria-modal={open ? true : undefined}
        aria-label={open ? t("sidebar.title") : undefined}
        className={open
          ? "fixed inset-y-0 left-0 z-40 flex w-[calc(100%-var(--space-6))] max-w-[calc(var(--layout-sidebar-max)+var(--space-6))] min-h-0 flex-col overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-app-bg)] p-[var(--space-4)] shadow-[var(--color-shadow-float)]"
          : "flex min-h-0 min-w-0 flex-col lg:h-full"}>
        <div className="flex shrink-0 items-start gap-[var(--space-2)]">
          <button ref={toggleRef} type="button" aria-expanded={open} aria-controls={panelId}
            aria-label={t(open ? "sidebar.close" : "sidebar.open")}
            className="mt-[var(--space-2)] flex size-[var(--icon-hit-size)] shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] lg:hidden"
            onClick={() => {
              if (!open) setHeaderHeight(sidebarRef.current?.offsetHeight ?? 0);
              setOpen(!open);
            }}>
            {open ? <X className="size-[var(--icon-size)]" aria-hidden="true" /> : <Menu className="size-[var(--icon-size)]" aria-hidden="true" />}
          </button>
          <div className="min-w-0 flex-1">{header}</div>
        </div>
        <div id={panelId} className={open ? "flex min-h-0 flex-1 flex-col" : "hidden min-h-0 flex-1 flex-col lg:flex"}>
          {children}
        </div>
      </aside>
    </div>
  );
}
