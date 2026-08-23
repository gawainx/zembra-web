export const common = {
  dataSource: {
    backend: "Backend",
    configured: "Supabase is not configured for this deployment.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    enterAction: "Enter Zembra",
    magicLinkSent: "Check your email for the sign-in link.",
    noWorkspaces: "No Supabase workspace is available for this account.",
    selectorLabel: "Data source",
    sendMagicLink: "Send Magic Link",
    supabase: "Supabase",
    workspaceLabel: "Workspace",
    workspacePlaceholder: "Select a workspace",
    workspacesUnavailable: "Supabase workspaces could not be loaded.",
  },
  backend: {
    connectionFailed: "Cannot connect to the backend. Confirm the service is running.",
    login: {
      checking: "Checking",
      description:
        "Enter your Zembra backend address, then choose a workspace after the connection check.",
      emptyUrl: "Enter a backend URL",
      enterAction: "Enter Zembra",
      hostLabel: "IP / Host",
      hostPlaceholder: "IP / Host: {{host}}",
      loadingWorkspaces: "Loading workspaces",
      loadWorkspacesAction: "Load workspaces",
      noWorkspaces: "No workspace is available, so the home page cannot open.",
      portLabel: "Port",
      portPlaceholder: "Port: {{port}}",
      refreshWorkspacesAction: "Refresh workspaces",
      savedUrlUnavailable:
        "The saved backend URL is not reachable. Enter it again.",
      savedWorkspaceUnavailable:
        "The saved workspace is unavailable. Choose another workspace.",
      submit: "Connect backend",
      title: "Connect backend",
      unreachable:
        "Cannot reach this backend URL. Confirm the address and service status.",
      urlLabel: "Backend URL",
      workspaceLabel: "Workspace",
      workspacePlaceholder: "Select a workspace",
      workspacesUnavailable:
        "Workspaces could not be loaded. Check the backend and try again.",
    },
  },
  mutation: {
    noteCreated: "Saved",
    noteCreateFailed: "Could not save. Please try again.",
    noteDeleted: "Deleted",
    noteDeleteFailed: "Could not delete. The note was restored.",
  },
  language: {
    label: "Language",
    title: "Change language",
  },
  theme: {
    switchToDark: "Switch to dark theme",
    switchToLight: "Switch to light theme",
  },
};
