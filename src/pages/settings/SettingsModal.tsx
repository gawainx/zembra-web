import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SyncClient } from "../../api/sync.client";
import { settingsCategories } from "./settingsRegistry";

interface SettingsModalProps {
  /** Backend synchronization client used by Settings categories. */
  client: SyncClient;
  /** Called when the modal should close. */
  onClose: () => void;
}

/** Renders the global Settings modal as a single-surface settings shell. */
export function SettingsModal({ client, onClose }: SettingsModalProps) {
  const { t } = useTranslation("settings");
  const initialCategoryId = settingsCategories[0]?.id;
  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  const activeCategory = useMemo(
    () =>
      settingsCategories.find((category) => category.id === activeCategoryId) ??
      settingsCategories[0],
    [activeCategoryId],
  );

  if (!activeCategory) {
    return null;
  }

  const activeCategoryLabel = t(activeCategory.labelKey);
  const activeCategoryTitle = t(activeCategory.titleKey);
  const activeCategoryDescription = activeCategory.descriptionKey
    ? t(activeCategory.descriptionKey)
    : undefined;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="grid max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-[700px] sm:max-w-[700px] gap-0 p-0 grid-cols-1 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-[var(--color-shadow-float)] md:h-[450px] md:grid-cols-[200px_minmax(0,1fr)]"
      >
        <aside className="flex min-w-0 flex-col px-3 pb-3 pt-3 md:min-h-[450px] md:px-4 md:pb-5 md:pt-5">
          <div className="flex min-h-11 items-center">
            <DialogClose asChild>
              <Button
                variant="plain"
                size="content"
                className="flex size-[var(--icon-hit-size)] shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
                type="button"
                aria-label={t("close")}
              >
                <X className="size-[var(--icon-size)]" aria-hidden="true" />
              </Button>
            </DialogClose>
          </div>

          <nav
            className="mt-[var(--space-2)] flex min-w-0 gap-[var(--space-1)] overflow-x-auto pb-[var(--space-1)] md:mt-7 md:flex-col md:overflow-visible md:pb-0"
            aria-label={t("title")}
          >
            {settingsCategories.map((category) => {
              const Icon = category.icon;
              const label = t(category.labelKey);

              return (
                <Button
                  variant="plain"
                  size="content"
                  key={category.id}
                  className="flex min-h-[var(--control-height)] shrink-0 items-center gap-[var(--space-3)] rounded-[var(--radius-surface)] px-[var(--space-3)] text-left text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] md:w-full"
                  type="button"
                  aria-current={
                    category.id === activeCategory.id ? "page" : undefined
                  }
                  data-active={category.id === activeCategory.id}
                  onClick={() => setActiveCategoryId(category.id)}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{label}</span>
                </Button>
              );
            })}
          </nav>
        </aside>

        <main className="min-h-0 min-w-0 overflow-y-auto px-5 pb-6 pt-4 sm:px-8 md:px-8 md:pb-6 md:pt-8">
          <DialogTitle asChild>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {activeCategoryTitle}
            </h1>
          </DialogTitle>
          {activeCategoryDescription ? (
            <DialogDescription asChild>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {activeCategoryDescription}
              </p>
            </DialogDescription>
          ) : null}
          <div className="mt-7 border-t border-[var(--color-border)] pt-0">
            {activeCategory.renderContent({ client })}
          </div>
        </main>
      </DialogContent>
    </Dialog>
  );
}
