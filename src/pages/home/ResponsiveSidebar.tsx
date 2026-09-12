import { Menu, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetClose,
} from "../../components/ui/sheet";

/** Keeps the desktop sidebar in place and delegates drawer focus and dismissal to Sheet. */
export function ResponsiveSidebar({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation("home");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <aside className="flex min-h-0 min-w-0 flex-col lg:h-full">
        <div className="flex shrink-0 items-start gap-[var(--space-2)]">
          <SheetTrigger asChild>
            <Button
              ref={triggerRef}
              variant="plain"
              size="icon"
              type="button"
              aria-label={t("sidebar.open")}
              className="mt-[var(--space-2)] shrink-0 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] lg:hidden"
            >
              <Menu className="size-[var(--icon-size)]" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <div className="min-w-0 flex-1">{header}</div>
        </div>
        {!open && (
          <div className="hidden min-h-0 flex-1 flex-col lg:flex">
            {children}
          </div>
        )}
      </aside>
      <SheetContent
        side="left"
        showCloseButton={false}
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
        className="w-[calc(100%-var(--space-6))] max-w-[calc(var(--layout-sidebar-max)+var(--space-6))] sm:max-w-[calc(var(--layout-sidebar-max)+var(--space-6))] min-h-0 gap-0 overflow-y-auto border-[var(--color-border)] bg-[var(--color-app-bg)] p-[var(--space-4)]"
      >
        <SheetTitle className="sr-only">{t("sidebar.title")}</SheetTitle>
        <div className="flex shrink-0 items-start gap-[var(--space-2)]">
          <SheetClose asChild>
            <Button
              variant="plain"
              size="icon"
              type="button"
              aria-label={t("sidebar.close")}
              className="mt-[var(--space-2)] shrink-0 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
            >
              <X className="size-[var(--icon-size)]" aria-hidden="true" />
            </Button>
          </SheetClose>
          <div className="min-w-0 flex-1">{header}</div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
