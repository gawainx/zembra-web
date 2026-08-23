import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

/** Describes public browser configuration needed to connect to Supabase. */
export interface SupabasePublicConfig {
  /** Public Supabase project URL. */
  url: string;
  /** Publishable browser key protected by Supabase RLS. */
  publishableKey: string;
  /** Workspaces this deployment may present at the Supabase entry gate. */
  workspaces: SupabaseWorkspaceConfig[];
}

/** Defines one deployment-authorized workspace and its bound Magic Link address. */
export interface SupabaseWorkspaceConfig {
  /** Workspace UUID used to scope all business requests after authentication. */
  id: string;
  /** Human-readable workspace label displayed before sign-in. */
  name: string;
  /** Email address to which Supabase sends the Magic Link for this workspace. */
  email: string;
}

/** Error raised when the browser build lacks its public Supabase configuration. */
export class SupabaseConfigurationError extends Error {
  /** Creates an error that can be shown in the data-source entry screen. */
  constructor() {
    super("Supabase is not configured for this deployment");
    this.name = "SupabaseConfigurationError";
  }
}

/** Reads and validates the public Supabase configuration embedded by Vite. */
export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const workspaces = parseSupabaseWorkspaces(
    import.meta.env.VITE_SUPABASE_WORKSPACES,
  );

  if (!url || !publishableKey || workspaces.length === 0) {
    throw new SupabaseConfigurationError();
  }

  return { publishableKey, url, workspaces };
}

/** Parses the public workspace-to-email bindings embedded by the deployment. */
function parseSupabaseWorkspaces(
  value: string | undefined,
): SupabaseWorkspaceConfig[] {
  if (!value?.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((workspace): SupabaseWorkspaceConfig[] => {
      if (!isSupabaseWorkspaceConfig(workspace)) {
        return [];
      }

      return [
        {
          email: workspace.email.trim(),
          id: workspace.id.trim(),
          name: workspace.name.trim(),
        },
      ];
    });
  } catch {
    return [];
  }
}

/** Checks whether one parsed environment value has every required workspace binding. */
function isSupabaseWorkspaceConfig(
  value: unknown,
): value is SupabaseWorkspaceConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const workspace = value as Record<string, unknown>;
  return (
    typeof workspace.id === "string" &&
    workspace.id.trim().length > 0 &&
    typeof workspace.name === "string" &&
    workspace.name.trim().length > 0 &&
    typeof workspace.email === "string" &&
    workspace.email.trim().length > 0
  );
}

/** Creates a browser Supabase client from public deployment configuration. */
export function createSupabaseBrowserClient(
  config: SupabasePublicConfig,
): SupabaseClient {
  return createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}

/** Returns the singleton browser Supabase client after logging configuration success. */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const config = getSupabasePublicConfig();
  console.info("[zembra] Creating Supabase browser client", { url: config.url });
  browserClient = createSupabaseBrowserClient(config);
  return browserClient;
}
