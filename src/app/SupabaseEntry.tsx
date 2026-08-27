import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { activateDataSource } from "../api/data-source-client";
import { createSupabaseDataSourceClients } from "../api/client";
import {
  getSupabaseBrowserClient,
  getSupabasePublicConfig,
  listSupabaseWorkspaces,
  SupabaseConfigurationError,
  type SupabaseWorkspace,
} from "../api/supabase.client";
import {
  clearConfiguredSupabaseWorkspaceId,
  getConfiguredSupabaseWorkspaceId,
  setConfiguredSupabaseWorkspaceId,
} from "../api/backendConfig";
import { WorkspaceProvider } from "./workspace-context";

interface SupabaseEntryProps {
  /** Shared source selector rendered before Supabase-specific controls. */
  dataSourceControl: ReactNode;
  /** Application content rendered after the Supabase session is confirmed. */
  children: ReactNode;
}

/** Handles Magic Link authentication followed by RLS-authorized workspace selection. */
export function SupabaseEntry({ children, dataSourceControl }: SupabaseEntryProps) {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [workspaces, setWorkspaces] = useState<SupabaseWorkspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    void loadSession();
  }, []);

  /** Restores a session and then loads only its RLS-authorized workspaces. */
  async function loadSession() {
    setIsLoading(true);
    setError(undefined);
    try {
      getSupabasePublicConfig();
      const client = getSupabaseBrowserClient();
      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      if (data.session) {
        setHasSession(true);
        await loadWorkspaces(client);
      }
    } catch (caught) {
      setError(
        caught instanceof SupabaseConfigurationError
          ? t("dataSource.configured")
          : t("dataSource.sessionUnavailable"),
      );
    } finally {
      setIsLoading(false);
    }
  }

  /** Sends a Magic Link before authentication or activates the selected authorized workspace. */
  async function handleSupabaseEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSendingRef.current || (hasSession && !selectedWorkspaceId)) {
      return;
    }

    isSendingRef.current = true;
    setIsSending(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const client = getSupabaseBrowserClient();
      if (hasSession) {
        activateSupabaseWorkspace(selectedWorkspaceId);
        setIsReady(true);
        return;
      }
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
      setError(
        caught instanceof SupabaseConfigurationError
          ? t("dataSource.configured")
          : t("dataSource.sessionUnavailable"),
      );
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }

  /** Loads workspaces visible to the authenticated user under the shared RLS policy. */
  async function loadWorkspaces(client: ReturnType<typeof getSupabaseBrowserClient>) {
    const nextWorkspaces = await listSupabaseWorkspaces(client);
    setWorkspaces(nextWorkspaces);
    if (nextWorkspaces.length === 0) {
      setError(t("dataSource.noWorkspaces"));
      return;
    }
    const savedWorkspaceId = getConfiguredSupabaseWorkspaceId();
    const savedWorkspace = nextWorkspaces.find(
      (workspace) => workspace.id === savedWorkspaceId,
    );
    if (savedWorkspaceId && !savedWorkspace) {
      clearConfiguredSupabaseWorkspaceId();
    }
    if (savedWorkspace) {
      setSelectedWorkspaceId(savedWorkspace.id);
      activateSupabaseWorkspace(savedWorkspace.id);
      setIsReady(true);
    }
  }

  /** Activates Supabase business clients for the chosen authorized workspace. */
  function activateSupabaseDataSource(
    client: ReturnType<typeof getSupabaseBrowserClient>,
    workspaceId: string,
  ) {
    activateDataSource({
      ...createSupabaseDataSourceClients(client, workspaceId),
      mode: "supabase",
      workspaceId,
    });
  }

  /** Activates and persists one Supabase workspace selected by the user. */
  function activateSupabaseWorkspace(workspaceId: string) {
    const client = getSupabaseBrowserClient();
    activateSupabaseDataSource(client, workspaceId);
    setConfiguredSupabaseWorkspaceId(workspaceId);
    setSelectedWorkspaceId(workspaceId);
    console.info("[zembra] Supabase workspace activated", {
      workspaceId: workspaceId.slice(0, 8),
    });
  }

  if (isReady) {
    const selectedWorkspace = workspaces.find(
      (workspace) => workspace.id === selectedWorkspaceId,
    );

    if (!selectedWorkspace) {
      return null;
    }

    return (
      <WorkspaceProvider
        switchWorkspace={activateSupabaseWorkspace}
        workspace={{
          id: selectedWorkspace.id,
          name: selectedWorkspace.name || t("dataSource.unnamedWorkspace"),
        }}
        workspaces={workspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name || t("dataSource.unnamedWorkspace"),
        }))}
      >
        {children}
      </WorkspaceProvider>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-app-bg)] px-5 text-[var(--color-text-primary)]">
      <section className="w-full max-w-[420px]">
        <div className="mb-8">
          <div className="mb-3 text-2xl font-bold">Zembra</div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {t("dataSource.supabase")}
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSupabaseEntry}>
          {dataSourceControl}
          {hasSession ? (
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              <span>{t("dataSource.workspaceLabel")}</span>
              <select
                aria-label={t("dataSource.workspaceLabel")}
                className="mt-2 h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-border-strong)]"
                disabled={isLoading || isSending || workspaces.length === 0}
                required
                value={selectedWorkspaceId}
                onChange={(event) => setSelectedWorkspaceId(event.target.value)}
              >
                <option value="">{t("dataSource.workspacePlaceholder")}</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name || t("dataSource.unnamedWorkspace")}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              <span>{t("dataSource.emailLabel")}</span>
              <input
                aria-label={t("dataSource.emailLabel")}
                className="mt-2 h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)]"
                disabled={isLoading || isSending}
                placeholder={t("dataSource.emailPlaceholder")}
                required
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setMessage(undefined);
                }}
              />
            </label>
          )}
          <button
            className="h-11 w-full rounded-[8px] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || (hasSession ? !selectedWorkspaceId : !email.trim())}
            type="submit"
          >
            {hasSession
              ? t("dataSource.enter")
              : isSending
                ? t("dataSource.sendingMagicLink")
                : message
                  ? t("dataSource.magicLinkSendSuccess")
                  : t("dataSource.sendMagicLink")}
          </button>
        </form>
        {message ? (
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p
            className="mt-3 rounded-[8px] border border-[var(--color-error-border)] bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
