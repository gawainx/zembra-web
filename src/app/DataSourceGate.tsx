import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackendUrlGate } from "./BackendUrlGate";
import {
  activateDataSource,
  getStoredDataSourceMode,
  setStoredDataSourceMode,
  type DataSourceMode,
} from "../api/data-source-client";
import { createSupabaseDataSourceClients } from "../api/client";
import {
  getSupabaseBrowserClient,
  getSupabasePublicConfig,
  SupabaseConfigurationError,
} from "../api/supabase.client";

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

  return <SupabaseEntry dataSourceControl={selector}>{children}</SupabaseEntry>;
}

interface SupabaseEntryProps {
  /** Shared source selector rendered before Supabase-specific controls. */
  dataSourceControl: ReactNode;
  /** Application content rendered after the Supabase session is confirmed. */
  children: ReactNode;
}

/** Handles Magic Link authentication for the deployment-configured Supabase workspace. */
function SupabaseEntry({ children, dataSourceControl }: SupabaseEntryProps) {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    void loadSession();
  }, []);

  /** Restores an existing Supabase session and activates its configured workspace. */
  async function loadSession() {
    setIsLoading(true);
    setError(undefined);
    try {
      const client = getSupabaseBrowserClient();
      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      if (data.session) {
        activateConfiguredSupabaseDataSource(client);
        setIsReady(true);
      }
    } catch (caught) {
      setError(caught instanceof SupabaseConfigurationError ? t("dataSource.configured") : t("dataSource.sessionUnavailable"));
    } finally {
      setIsLoading(false);
    }
  }

  /** Sends a passwordless login email that returns the user to the current Vercel origin. */
  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const client = getSupabaseBrowserClient();
      const { error: signInError } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (signInError) {
        throw signInError;
      }
      console.info("[zembra] Sent Supabase Magic Link");
      setMessage(t("dataSource.magicLinkSent"));
    } catch (caught) {
      console.warn("[zembra] Failed to send Supabase Magic Link", { error: caught });
      setError(caught instanceof SupabaseConfigurationError ? t("dataSource.configured") : t("dataSource.sessionUnavailable"));
    } finally {
      setIsSending(false);
    }
  }

  /** Activates Supabase business clients for the workspace fixed in public deployment config. */
  function activateConfiguredSupabaseDataSource(
    client: ReturnType<typeof getSupabaseBrowserClient>,
  ) {
    const { workspaceId } = getSupabasePublicConfig();
    activateDataSource({
      ...createSupabaseDataSourceClients(client, workspaceId),
      mode: "supabase",
      workspaceId,
    });
  }

  if (isReady) {
    return children;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-app-bg)] px-5 text-[var(--color-text-primary)]">
      <section className="w-full max-w-[420px]">
        <div className="mb-8">
          <div className="mb-3 text-2xl font-bold">Zembra</div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{t("dataSource.supabase")}</p>
        </div>
        <form className="space-y-4" onSubmit={handleMagicLink}>
          {dataSourceControl}
          <label className="block text-sm font-medium text-[var(--color-text-primary)]">
            <span>{t("dataSource.emailLabel")}</span>
            <input aria-label={t("dataSource.emailLabel")} className="mt-2 h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)]" disabled={isLoading || isSending} placeholder={t("dataSource.emailPlaceholder")} required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <button className="h-11 w-full rounded-[8px] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)] disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoading || isSending} type="submit">{t("dataSource.sendMagicLink")}</button>
        </form>
        {message ? <p className="mt-3 text-sm text-[var(--color-text-secondary)]" role="status">{message}</p> : null}
        {error ? <p className="mt-3 rounded-[8px] border border-[var(--color-error-border)] bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]" role="alert">{error}</p> : null}
      </section>
    </main>
  );
}
