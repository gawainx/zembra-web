import { Settings } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SyncClient } from "../../api/sync.client";
import { SettingsModal } from "./SettingsModal";

interface SettingsModuleProps {
  /** Backend synchronization client used by the Settings module. */
  client: SyncClient;
}

/**
 * Renders the self-contained Settings module entrypoint.
 *
 * @param props.client Backend synchronization client used by settings sections.
 * @returns A toolbar button and the Settings modal when opened.
 */
export function SettingsModule({ client }: SettingsModuleProps) {
  const { t } = useTranslation("settings");
  const [isOpen, setIsOpen] = useState(false);
  const title = t("form.settings.title");

  return (
    <>
      <button
        className="flex size-[var(--icon-hit-size)] shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
        title={title}
        type="button"
        aria-label={title}
        onClick={() => setIsOpen(true)}
      >
        <Settings
          className="size-[var(--icon-size)] text-[var(--color-accent)]"
          aria-hidden="true"
        />
      </button>
      {isOpen ? (
        <SettingsModal client={client} onClose={() => setIsOpen(false)} />
      ) : null}
    </>
  );
}
