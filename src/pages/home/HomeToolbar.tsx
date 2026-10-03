import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "../../components/ui/input";

/** Renders the home feed toolbar. */
export function HomeToolbar({ keyword, onKeywordChange }: {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
}) {
  const { t } = useTranslation("home");
  return (
    <header className="mb-4 flex min-h-11 shrink-0 items-center justify-end lg:mb-3">
      <label className="flex h-[var(--control-height)] w-full items-center gap-[var(--space-2)] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-4)] text-sm text-[var(--color-text-muted)] lg:max-w-80">
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
