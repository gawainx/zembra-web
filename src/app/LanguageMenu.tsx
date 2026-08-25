import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  persistLocale,
  syncDocumentLocale,
} from "../i18n/locale";
import {
  localeOptions,
  type SupportedLocale,
} from "../i18n/types";

/** Renders the app-wide language selector and persists user preference. */
export function LanguageMenu() {
  const { i18n, t } = useTranslation("common");
  const currentLocale = i18n.resolvedLanguage as SupportedLocale;

  /** Applies the selected language to i18next, storage, and document metadata. */
  async function handleLocaleChange(locale: SupportedLocale) {
    await i18n.changeLanguage(locale);
    persistLocale(window.localStorage, locale);
    syncDocumentLocale(locale);
  }

  return (
    <label
      className="inline-flex h-[var(--control-height)] shrink-0 items-center gap-[var(--space-2)] rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
      title={t("language.title")}
    >
      <Languages className="size-4 text-[var(--color-accent)]" aria-hidden="true" />
      <span className="sr-only">{t("language.label")}</span>
      <select
        aria-label={t("language.label")}
        className="max-w-24 bg-transparent text-xs font-semibold outline-none"
        value={currentLocale}
        onChange={(event) => void handleLocaleChange(event.target.value as SupportedLocale)}
      >
        {localeOptions.map((option) => (
          <option key={option.locale} value={option.locale}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
