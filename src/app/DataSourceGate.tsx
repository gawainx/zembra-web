import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackendUrlGate } from "./BackendUrlGate";
import {
  activateDataSource,
  clearStoredSupabaseWorkspaceId,
  getStoredDataSourceMode,
  getStoredSupabaseWorkspaceId,
  setStoredDataSourceMode,
  setStoredSupabaseWorkspaceId,
  type DataSourceMode,
} from "../api/data-source-client";
import { createSupabaseDataSourceClients } from "../api/client";
import {
  getSupabaseBrowserClient,
  SupabaseConfigurationError,
} from "../api/supabase.client";

interface DataSourceGateProps {
  /** Application content rendered after one source and workspace are confirmed. */
  children: ReactNode;
}

interface SupabaseWorkspace {
  /** Stable UUID used as the workspace scope. */
  id: string;
  /** Optional visible workspace name. */
  workspace_name: string | null;
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
  /** Application content rendered after the Supabase workspace is confirmed. */
  children: ReactNode;
}

/** Handles Magic Link authentication and RLS-visible workspace selection for Supabase mode. */
function SupabaseEntry({ children, dataSourceControl }: SupabaseEntryProps) {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [workspaces, setWorkspaces] = useState<SupabaseWorkspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    void loadSession();
  }, []);

  /** Restores an existing Supabase session and then loads its visible workspaces. */
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
        setIsAuthenticated(true);
        await loadWorkspaces();
      }
    } catch (caught) {
      setError(caught instanceof SupabaseConfigurationError ? t("dataSource.configured") : t("dataSource.workspacesUnavailable"));
    } finally {
      setIsLoading(false);
    }
  }

  /** Loads only the workspaces made visible by the current Supabase session and RLS policies. */
  async function loadWorkspaces() {
    const client = getSupabaseBrowserClient();
    const { data, error: workspacesError } = await client
      .from("workspaces")
      .select("id, workspace_name")
      .is("deleted_at", null)
      .is("archived_at", null)
      .order("updated_at", { ascending: false });
    if (workspacesError) {
      throw workspacesError;
    }
    const nextWorkspaces = (data ?? []) as SupabaseWorkspace[];
    setWorkspaces(nextWorkspaces);
    if (nextWorkspaces.length === 0) {
      setError(t("dataSource.noWorkspaces"));
      return;
    }
    const savedWorkspaceId = getStoredSupabaseWorkspaceId();
    const savedWorkspace = nextWorkspaces.find((workspace) => workspace.id === savedWorkspaceId);
    if (savedWorkspaceId && !savedWorkspace) {
      clearStoredSupabaseWorkspaceId();
    }
    setSelectedWorkspaceId((savedWorkspace ?? nextWorkspaces[0])?.id ?? "");
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
      setError(caught instanceof SupabaseConfigurationError ? t("dataSource.configured") : t("dataSource.workspacesUnavailable"));
    } finally {
      setIsSending(false);
    }
  }

  /** Activates Supabase business clients after the user chooses an RLS-visible workspace. */
  function handleEnter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkspaceId) {
      return;
    }
    const client = getSupabaseBrowserClient();
    setStoredSupabaseWorkspaceId(selectedWorkspaceId);
    activateDataSource({
      ...createSupabaseDataSourceClients(client, selectedWorkspaceId),
      mode: "supabase",
      workspaceId: selectedWorkspaceId,
    });
    setIsReady(true);
  }

  if (isReady) {
    return children;
  }

  const hasSessionWorkspaces = isAuthenticated;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-app-bg)] px-5 text-[var(--color-text-primary)]">
      <section className="w-full max-w-[420px]">
        <div className="mb-8">
          <div className="mb-3 text-2xl font-bold">Zembra</div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{t("dataSource.supabase")}</p>
        </div>
        {hasSessionWorkspaces ? (
          <form className="space-y-4" onSubmit={handleEnter}>
            {dataSourceControl}
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              <span>{t("dataSource.workspaceLabel")}</span>
              <select aria-label={t("dataSource.workspaceLabel")} className="mt-2 h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)]" value={selectedWorkspaceId} onChange={(event) => setSelectedWorkspaceId(event.target.value)}>
                <option value="">{t("dataSource.workspacePlaceholder")}</option>
                {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{formatWorkspaceName(workspace)}</option>)}
              </select>
            </label>
            <button className="h-11 w-full rounded-[8px] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)] disabled:cursor-not-allowed disabled:opacity-60" disabled={!selectedWorkspaceId || isLoading} type="submit">{t("dataSource.enterAction")}</button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleMagicLink}>
            {dataSourceControl}
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              <span>{t("dataSource.emailLabel")}</span>
              <input aria-label={t("dataSource.emailLabel")} className="mt-2 h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)]" disabled={isLoading || isSending} placeholder={t("dataSource.emailPlaceholder")} required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <button className="h-11 w-full rounded-[8px] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)] disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoading || isSending} type="submit">{t("dataSource.sendMagicLink")}</button>
          </form>
        )}
        {message ? <p className="mt-3 text-sm text-[var(--color-text-secondary)]" role="status">{message}</p> : null}
        {error ? <p className="mt-3 rounded-[8px] border border-[var(--color-error-border)] bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]" role="alert">{error}</p> : null}
      </section>
    </main>
  );
}

/** Formats an RLS-visible workspace with its name or a stable short identifier. */
function formatWorkspaceName(workspace: SupabaseWorkspace): string {
  return workspace.workspace_name?.trim() || workspace.id.slice(0, 8);
}
