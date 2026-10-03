import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import type { NoteSortOrder } from "./homeUtils";

/** Renders the home feed toolbar. */
export function HomeToolbar({ keyword, onKeywordChange, sortOrder, onSortToggle }: {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  sortOrder: NoteSortOrder;
  onSortToggle: () => void;
}) {
  const { t } = useTranslation("home");
  const SortIcon = sortOrder === "newest" ? ArrowDownWideNarrow : ArrowUpNarrowWide;
  return (
    <header className="mb-4 flex min-h-11 shrink-0 items-center justify-end gap-[var(--space-2)] lg:mb-3">
      <Button variant="plain" size="content" type="button"
        className="flex size-[var(--icon-hit-size)] shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
        aria-label={t(sortOrder === "newest" ? "sort.switchToOldest" : "sort.switchToNewest")}
        onClick={onSortToggle}
      >
        <SortIcon className="size-[var(--icon-size)]" aria-hidden="true" />
      </Button>
      <label className="flex h-[var(--control-height)] min-w-0 w-full items-center gap-[var(--space-2)] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-4)] text-sm text-[var(--color-text-muted)] lg:max-w-80">
        <Search className="size-4" aria-hidden="true" />
        <Input
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--color-text-muted)]"
          placeholder={t("search.placeholder")}
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
        />
        <span className="text-[var(--color-text-muted)]">⌘+K</span>
      </label>
    </header>
  );
}
