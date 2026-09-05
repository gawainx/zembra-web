import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { activateDataSource } from "../api/client";
import {
  getSupabaseBrowserClient,
  getSupabasePublicConfig,
  listSupabaseWorkspaces,
  renameSupabaseWorkspace,
  SupabaseConfigurationError,
  type SupabaseWorkspace,
} from "../api/supabase.client";
import {
  clearConfiguredSupabaseWorkspaceId,
  getConfiguredSupabaseWorkspaceId,
  setConfiguredSupabaseWorkspaceId,
} from "../api/backendConfig";
import { WorkspaceProvider } from "./workspace-context";
import { notifyMutationCompleted } from "./mutationToast";

const workspaceRenameQueues = new Map<string, Promise<void>>();
const workspaceRenameVersions = new Map<string, number>();

interface SupabaseEntryProps {
  /** Application content rendered after the Supabase session is confirmed. */
  children: ReactNode;
}

/** Handles Magic Link authentication followed by RLS-authorized workspace selection. */
export function SupabaseEntry({ children }: SupabaseEntryProps) {
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

  /** Activates and persists one Supabase workspace selected by the user. */
  function activateSupabaseWorkspace(workspaceId: string) {
    const client = getSupabaseBrowserClient();
    activateDataSource(client, workspaceId);
    setConfiguredSupabaseWorkspaceId(workspaceId);
    setSelectedWorkspaceId(workspaceId);
    console.info("[zembra] Supabase workspace activated", {
      workspaceId: workspaceId.slice(0, 8),
    });
  }

  /** Optimistically renames one workspace and queues its remote Supabase update. */
  async function renameWorkspace(workspaceId: string, name: string): Promise<void> {
    const previousWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);

    if (!previousWorkspace) {
      return;
    }

    const nextVersion = (workspaceRenameVersions.get(workspaceId) ?? 0) + 1;
    workspaceRenameVersions.set(workspaceId, nextVersion);
    const renamedWorkspace = { ...previousWorkspace, name };
    setWorkspaces((currentWorkspaces) =>
      currentWorkspaces.map((workspace) =>
        workspace.id === renamedWorkspace.id ? renamedWorkspace : workspace,
      ),
    );

    return enqueueWorkspaceRename(workspaceId, async () => {
      try {
        await renameSupabaseWorkspace(getSupabaseBrowserClient(), workspaceId, name);
        notifyMutationCompleted({
          duration: 3000,
          message: "workspaceRenamed",
          tone: "success",
        });
      } catch (error) {
        if (workspaceRenameVersions.get(workspaceId) === nextVersion) {
          setWorkspaces((currentWorkspaces) =>
            currentWorkspaces.map((workspace) =>
              workspace.id === workspaceId ? previousWorkspace : workspace,
            ),
          );
        }
        console.warn("[zembra] Failed to rename Supabase workspace", {
          error,
          workspaceId: workspaceId.slice(0, 8),
        });
        notifyMutationCompleted({
          duration: 10000,
          message: "workspaceRenameFailed",
          tone: "error",
        });
      }
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
        renameWorkspace={renameWorkspace}
        switchWorkspace={activateSupabaseWorkspace}
        workspace={{
          id: selectedWorkspace.id,
          name: selectedWorkspace.name || t("dataSource.unnamedWorkspace"),
          title: selectedWorkspace.name || t("dataSource.unnamedWorkspace"),
        }}
        workspaces={workspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name || t("dataSource.unnamedWorkspace"),
          title: workspace.name || t("dataSource.unnamedWorkspace"),
        }))}
      >
        {children}
      </WorkspaceProvider>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-app-bg)] p-[var(--space-5)] text-[var(--color-text-primary)]">
      <section className="flex w-full max-w-[var(--layout-entry-max)] flex-col gap-[var(--space-5)]">
        <header className="flex items-baseline gap-[var(--space-3)] whitespace-nowrap">
          <h1 className="flex items-baseline gap-[var(--space-2)] text-lg font-semibold"><span aria-hidden="true">ℤ</span> Zembra</h1>
          <span className="text-sm text-[var(--color-text-muted)]">{t("dataSource.supabase")}</span>
        </header>
        <form className="flex flex-col gap-[var(--space-3)]" onSubmit={handleSupabaseEntry}>
          {hasSession ? (
            <label className="block min-w-0 text-sm font-normal text-[var(--color-text-primary)]">

              <select
                aria-label={t("dataSource.workspaceLabel")}
                className="h-[var(--control-height)] w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-3)] text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-border-strong)]"
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
            <label className="block min-w-0 text-sm font-normal text-[var(--color-text-primary)]">

              <input
                aria-label={t("dataSource.emailLabel")}
                className="h-[var(--control-height)] w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-3)] text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-strong)]"
                disabled={isLoading || isSending}
                autoComplete="email"
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
            className="h-[var(--control-height)] w-full rounded-[var(--radius-control)] bg-[var(--color-accent)] px-[var(--space-4)] whitespace-nowrap text-sm font-medium text-[var(--color-accent-contrast)] disabled:cursor-not-allowed disabled:opacity-60"
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
          <p className="text-sm text-[var(--color-text-secondary)]" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p
            className="rounded-[var(--radius-control)] border border-[var(--color-error-border)] bg-[var(--color-error-soft)] px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--color-error)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}

/** Serializes remote workspace renames without delaying their local UI updates. */
function enqueueWorkspaceRename(
  workspaceId: string,
  operation: () => Promise<void>,
): Promise<void> {
  const previous = workspaceRenameQueues.get(workspaceId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(operation);
  workspaceRenameQueues.set(workspaceId, next);
  void next.finally(() => {
    if (workspaceRenameQueues.get(workspaceId) === next) {
      workspaceRenameQueues.delete(workspaceId);
    }
  });
  return next;
}
