import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeProvider";
import { getNextThemePreference } from "./theme";

/** Renders a single-click light and dark theme toggle. */
export function ThemeToggle() {
  const { t } = useTranslation("common");
  const { preference, setPreference } = useTheme();
  const nextPreference = getNextThemePreference(preference);
  const Icon = preference === "dark" ? Moon : Sun;
  const label =
    preference === "dark" ? t("theme.switchToLight") : t("theme.switchToDark");

  return (
    <button
      className="inline-flex size-[var(--control-size)] shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setPreference(nextPreference)}
    >
      <Icon
        className="size-4 text-[var(--color-accent)]"
        aria-hidden="true"
      />
    </button>
  );
}
