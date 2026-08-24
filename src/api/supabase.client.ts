import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

/** Describes public browser configuration needed to connect to Supabase. */
export interface SupabasePublicConfig {
  /** Public Supabase project URL. */
  url: string;
  /** Publishable browser key protected by Supabase RLS. */
  publishableKey: string;
}

/** Represents one workspace authorized by the current Supabase session. */
export interface SupabaseWorkspace {
  /** Workspace UUID used to scope all business requests after selection. */
  id: string;
  /** Optional workspace name supplied by the shared schema. */
  name: string | null;
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

  if (!url || !publishableKey) {
    throw new SupabaseConfigurationError();
  }

  return { publishableKey, url };
}

/** Loads the workspaces visible to the authenticated user through shared-schema RLS. */
export async function listSupabaseWorkspaces(
  client: SupabaseClient,
): Promise<SupabaseWorkspace[]> {
  console.info("[zembra] Loading Supabase workspaces for authenticated user");
  const { data, error } = await client
    .from("workspaces")
    .select("id, workspace_name")
    .order("workspace_name");

  if (error) {
    console.warn("[zembra] Failed to load Supabase workspaces", { error });
    throw error;
  }

  const workspaces = (data ?? []).map((workspace) => ({
    id: workspace.id,
    name: workspace.workspace_name,
  }));
  console.info("[zembra] Loaded Supabase workspaces", {
    workspaceCount: workspaces.length,
  });
  return workspaces;
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
