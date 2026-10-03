/** Startup stages used for actionable, non-sensitive failure messages. */
export type SupabaseEntryStage = "configuration" | "session" | "workspaces";

const reasonByCode = {
  session_not_found: "expired",
  session_expired: "expired",
  refresh_token_not_found: "expired",
  refresh_token_already_used: "expired",
  user_not_found: "expired",
  user_banned: "denied",
  over_request_rate_limit: "rateLimit",
  request_timeout: "timeout",
  unexpected_failure: "server",
  "42501": "denied",
  PGRST301: "credentials",
  PGRST303: "credentials",
  PGRST205: "workspaceUnavailable",
  "42P01": "workspaceUnavailable",
} as const;

/** Classifies only known signals; raw exception text never becomes UI or log output. */
export function describeSupabaseEntryFailure(error: unknown, stage: SupabaseEntryStage) {
  const value = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const code = typeof value.code === "string" && Object.hasOwn(reasonByCode, value.code)
    ? value.code as keyof typeof reasonByCode : undefined;
  const status = typeof value.status === "number" && Number.isInteger(value.status)
    && value.status >= 400 && value.status <= 599 ? value.status : undefined;
  const knownReason = code ? reasonByCode[code] : undefined;
  const sessionExpired = stage === "session"
    && (knownReason === "expired" || value.name === "AuthSessionMissingError");
  const networkFailure = value.name === "AuthRetryableFetchError" && !status
    || typeof value.message === "string" && /^(TypeError: )?(Failed to fetch|fetch failed|Load failed|NetworkError when attempting to fetch resource\.?)$/i.test(value.message);
  const reason = value.name === "SupabaseConfigurationError" ? "configuration"
    : knownReason ?? (status === 429 ? "rateLimit"
      : status === 408 || value.name === "TimeoutError" ? "timeout"
      : status && status >= 500 ? "server"
      : status === 401 ? "credentials"
      : status === 403 ? "denied"
      : networkFailure ? (navigator.onLine === false ? "offline" : "network")
      : "unknown");
  return { stage, reason, code, status, sessionExpired };
}

export type SupabaseEntryFailure = ReturnType<typeof describeSupabaseEntryFailure>;
