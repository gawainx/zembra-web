import { LoaderCircle } from "lucide-react";
import type { SupabaseEntryFailure } from "./supabaseEntryUtils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { NativeSelect } from "../components/ui/native-select";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { SupabaseWorkspace } from "../api/supabase.client";

interface SupabaseEntryFormProps {
  email: string;
  workspaces: SupabaseWorkspace[];
  selectedWorkspaceId: string;
  isLoading: boolean;
  startupFailure?: SupabaseEntryFailure;
  isSending: boolean;
  hasSession: boolean;
  message?: string;
  error?: string;
  onEmailChange: (email: string) => void;
  onWorkspaceChange: (id: string) => void;
  handleSupabaseEntry: (event: FormEvent<HTMLFormElement>) => void;
}

/** Displays the existing email and workspace entry forms. */
export function SupabaseEntryForm({
  email, workspaces, selectedWorkspaceId, isLoading, startupFailure,
  isSending, hasSession, message, error, onEmailChange,
  onWorkspaceChange, handleSupabaseEntry,
}: SupabaseEntryFormProps) {
  const { t } = useTranslation("common");
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-app-bg)] p-[var(--space-5)] text-[var(--color-text-primary)]">
      <section className="flex w-full max-w-[var(--layout-entry-max)] flex-col gap-[var(--space-5)]">
        <header className={`flex ${isLoading || startupFailure ? "justify-center" : ""} items-baseline gap-[var(--space-3)] whitespace-nowrap`}>
          <h1 aria-label="Zembra" className="whitespace-nowrap text-lg font-semibold"><span aria-hidden="true">ℤembra</span></h1>
          {!isLoading && !startupFailure && <span className="text-sm text-[var(--color-text-muted)]">{t("dataSource.supabase")}</span>}
        </header>
        {isLoading ? (
          <div role="status" className="flex items-center justify-center gap-[var(--space-2)] text-sm text-[var(--color-text-muted)]">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            {t("dataSource.startup.loading")}
          </div>
        ) : startupFailure ? (
          <div role="alert" className="flex flex-col gap-[var(--space-3)] break-words text-sm text-[var(--color-text-secondary)]">
            <h2 className="text-center font-medium text-[var(--color-text-primary)]">{t("dataSource.startup.failed")}</h2>
            <p>{t(`dataSource.startup.stages.${startupFailure.stage}`)}</p>
            <p>{t(`dataSource.startup.reasons.${startupFailure.reason}`)}</p>
            {startupFailure.status && <p>HTTP {startupFailure.status}</p>}
            {startupFailure.code && <p>{t("dataSource.startup.errorCode", { code: startupFailure.code })}</p>}
          </div>
        ) : <form className="flex flex-col gap-[var(--space-3)]" onSubmit={handleSupabaseEntry}>
          {hasSession ? (
            <label className="block min-w-0 text-sm font-normal text-[var(--color-text-primary)]">

              <NativeSelect
                aria-label={t("dataSource.workspaceLabel")}
                className="h-[var(--control-height)] w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-3)] text-sm text-[var(--color-text-primary)] outline-none transition"
                disabled={isLoading || isSending || workspaces.length === 0}
                required
                value={selectedWorkspaceId}
                onChange={(event) => onWorkspaceChange(event.target.value)}
              >
                <option value="">{t("dataSource.workspacePlaceholder")}</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name || t("dataSource.unnamedWorkspace")}
                  </option>
                ))}
              </NativeSelect>
            </label>
          ) : (
            <label className="block min-w-0 text-sm font-normal text-[var(--color-text-primary)]">

              <Input
                aria-label={t("dataSource.emailLabel")}
                className="h-[var(--control-height)] w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-3)] text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                disabled={isLoading || isSending}
                autoComplete="email"
                placeholder={t("dataSource.emailPlaceholder")}
                required
                type="email"
                value={email}
                onChange={(event) => {
                  onEmailChange(event.target.value);
                }}
              />
            </label>
          )}
          <Button variant="plain" size="content"
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
          </Button>
        </form>}
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
