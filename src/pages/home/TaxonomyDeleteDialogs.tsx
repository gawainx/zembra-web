import type { TagDto } from "../../api/types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../components/ui/alert-dialog";

/** Renders the in-app confirmation dialog for deleting an empty tag subtree. */
export function TagDeleteDialog({
  tag,
  onCancel,
  onConfirm,
  t,
}: {
  tag: TagDto;
  onCancel: () => void;
  onConfirm: () => void;
  t: (key: string, options?: Record<string, string>) => string;
}) {
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent className="block w-[calc(100%-2rem)] max-w-sm data-[size=default]:sm:max-w-sm rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--color-shadow-float)]">
        <AlertDialogTitle asChild>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            {t("tag.delete.title")}
          </h2>
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            {t("tag.delete.description", { tag: tag.path })}
          </p>
        </AlertDialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <AlertDialogCancel
            variant="plain"
            size="content"
            className="h-9 rounded-[10px] px-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
            type="button"
          >
            {t("tag.delete.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="plain"
            size="content"
            className="h-9 rounded-[10px] bg-[var(--color-error)] px-3 text-sm font-semibold text-[var(--color-error-contrast)] hover:opacity-90"
            type="button"
            onClick={onConfirm}
          >
            {t("tag.delete.confirm")}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
