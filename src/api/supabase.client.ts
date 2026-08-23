import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

/** Describes public browser configuration needed to connect to Supabase. */
export interface SupabasePublicConfig {
  /** Public Supabase project URL. */
  url: string;
  /** Publishable browser key protected by Supabase RLS. */
  publishableKey: string;
  /** Fixed workspace scope selected by this deployment. */
  workspaceId: string;
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
  const workspaceId = import.meta.env.VITE_SUPABASE_WORKSPACE_ID?.trim();

  if (!url || !publishableKey || !workspaceId) {
    throw new SupabaseConfigurationError();
  }

  return { publishableKey, url, workspaceId };
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
