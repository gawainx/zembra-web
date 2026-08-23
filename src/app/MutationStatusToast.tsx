import { useTranslation } from "react-i18next";
import type { MutationToastNotification } from "./mutationToast";

/** Renders one low-interruption notification for a completed note mutation. */
export function MutationStatusToast({
  notification,
}: {
  /** Completed note mutation displayed by the application shell. */
  notification: MutationToastNotification;
}) {
  const { t } = useTranslation("common");
  const isFailure = notification.tone === "error";

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2.5rem)] rounded-lg border bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-secondary)] shadow-[var(--color-shadow-card)] ${isFailure ? "border-[var(--color-error-border)]" : "border-[var(--color-success-border)]"}`}
      role={isFailure ? "alert" : "status"}
    >
      {t(`mutation.${notification.message}`)}
    </div>
  );
}
