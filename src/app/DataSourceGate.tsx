import { lazy, ReactNode, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackendUrlGate } from "./BackendUrlGate";
import {
  getStoredDataSourceMode,
  setStoredDataSourceMode,
  type DataSourceMode,
} from "../api/data-source-client";

/** Loads Supabase authentication only after the user chooses that data source. */
const SupabaseEntry = lazy(async () => ({
  default: (await import("./SupabaseEntry")).SupabaseEntry,
}));

interface DataSourceGateProps {
  /** Application content rendered after one source and workspace are confirmed. */
  children: ReactNode;
}

/** Renders the shared data-source selector and the entry flow for its active mode. */
export function DataSourceGate({ children }: DataSourceGateProps) {
  const { t } = useTranslation("common");
  const [mode, setMode] = useState<DataSourceMode>(getStoredDataSourceMode);

  /** Stores a source selection before rendering its mode-specific entry form. */
  function handleModeChange(nextMode: DataSourceMode) {
    setStoredDataSourceMode(nextMode);
    setMode(nextMode);
  }

  const selector = (
    <label className="block text-sm font-medium text-[var(--color-text-primary)]">
      <span>{t("dataSource.selectorLabel")}</span>
      <select
        aria-label={t("dataSource.selectorLabel")}
        className="mt-2 h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-border-strong)]"
        value={mode}
        onChange={(event) => handleModeChange(event.target.value as DataSourceMode)}
      >
        <option value="backend">{t("dataSource.backend")}</option>
        <option value="supabase">{t("dataSource.supabase")}</option>
      </select>
    </label>
  );

  if (mode === "backend") {
    return <BackendUrlGate dataSourceControl={selector}>{children}</BackendUrlGate>;
  }

  return (
    <Suspense fallback={null}>
      <SupabaseEntry dataSourceControl={selector}>{children}</SupabaseEntry>
    </Suspense>
  );
}
