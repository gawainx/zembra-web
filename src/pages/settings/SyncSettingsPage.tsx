import { SettingsModal } from "./SettingsModal";
import type { SyncClient } from "../../api/sync.client";

interface SyncSettingsPageProps {
  /** Backend synchronization client used by this legacy settings route. */
  client: SyncClient;
}

/** Renders a compatibility shell for the legacy synchronization settings route. */
export function SyncSettingsPage({ client }: SyncSettingsPageProps) {
  return (
    <main className="min-h-screen bg-[var(--color-app-bg)] px-4 py-6 text-[var(--color-text-primary)]">
      <SettingsModal client={client} onClose={() => undefined} />
    </main>
  );
}
