import { Loader2, RefreshCw } from "lucide-react";
import { createContext, ReactNode, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSyncClient } from "@zembra/data-source-runtime";
import { ApiError } from "../../../api/http";
import { SettingsModule } from "../../settings/SettingsModule";

interface SourceHomeControlsContextValue {
  /** Whether a manual Backend synchronization is active. */
  isSyncing: boolean;
  /** Starts a Backend synchronization and records visible feedback. */
  runSync: () => Promise<void>;
  /** Latest successful synchronization summary. */
  syncFeedback?: string;
  /** Latest synchronization failure message. */
  syncError?: string;
}

const SourceHomeControlsContext = createContext<SourceHomeControlsContextValue | undefined>(undefined);

/** Provides Backend-only manual synchronization state to home controls. */
export function SourceHomeControlsProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation("home");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string>();
  const [syncError, setSyncError] = useState<string>();

  /** Runs a Backend synchronization cycle without blocking unrelated workspace controls. */
  async function runSync() {
    setIsSyncing(true);
    setSyncFeedback(undefined);
    setSyncError(undefined);

    try {
      const result = await getSyncClient().runSync();
      setSyncFeedback(t("actions.syncSummary", { pulled: result.pulled, pushed: result.pushed }));
    } catch (error) {
      setSyncError(formatErrorMessage(error));
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <SourceHomeControlsContext.Provider value={{ isSyncing, runSync, syncError, syncFeedback }}>
      {children}
    </SourceHomeControlsContext.Provider>
  );
}

/** Renders Backend-only synchronization and settings actions in the home toolbar. */
export function SourceToolbarActions() {
  const { t } = useTranslation("home");
  const { isSyncing, runSync } = useSourceHomeControls();

  return (
    <>
      <button
        aria-label={t("actions.sync")}
        className="flex size-[var(--icon-hit-size)] shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSyncing}
        title={t("actions.sync")}
        type="button"
        onClick={() => void runSync()}
      >
        {isSyncing ? <Loader2 className="size-[var(--icon-size)] animate-spin text-[var(--color-accent)]" aria-hidden="true" /> : <RefreshCw className="size-[var(--icon-size)] text-[var(--color-accent)]" aria-hidden="true" />}
      </button>
      <SettingsModule client={getSyncClient()} />
    </>
  );
}

/** Renders Backend synchronization feedback below the home toolbar. */
export function SourceStatusFeedback() {
  const { syncError, syncFeedback } = useSourceHomeControls();

  if (!syncFeedback && !syncError) {
    return null;
  }

  return (
    <p
      className="mb-3 rounded-[10px] border px-3 py-2 text-sm data-[tone=error]:border-[var(--color-error-border)] data-[tone=error]:bg-[var(--color-error-soft)] data-[tone=error]:text-[var(--color-error)] data-[tone=success]:border-[var(--color-success-border)] data-[tone=success]:bg-[var(--color-success-soft)] data-[tone=success]:text-[var(--color-accent)]"
      data-tone={syncError ? "error" : "success"}
      role="status"
    >
      {syncError ?? syncFeedback}
    </p>
  );
}

/** Returns the required Backend synchronization controls context. */
function useSourceHomeControls(): SourceHomeControlsContextValue {
  const value = useContext(SourceHomeControlsContext);

  if (!value) {
    throw new Error("Backend home controls require SourceHomeControlsProvider");
  }

  return value;
}

/** Formats an unknown synchronization failure into a short user-facing message. */
function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "Request failed";
}
