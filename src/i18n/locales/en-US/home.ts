export const home = {
  random: {
    "title": "Random notes",
    "insufficient": "Add more than 20 unarchived notes to this workspace to use random notes.",
    "loading": "Drawing random notes…",
    "failed": "Could not load random notes. Please try again.",
    "empty": "This batch has been removed. Select Random notes again."
  },
  actions: {
    sync: "Sync",
    syncSummary: "Pushed {{pushed}}, pulled {{pulled}}",
  },
  badge: {
    local: "LOCAL",
    supabase: "SUPABASE",
  },
  composer: {
    editorLoading: "Loading editor",
    placeholder: "What are you thinking now?",
    send: "Send",
    tagSuggestion: {
      create: "Create #{{tag}}",
      empty: "No matching tags",
      saveHint: "Tag will be created on save",
    },
    tools: {
      bold: "Bold",
      field: "Insert Field",
      list: "Insert list",
      tag: "Insert tag",
    },
  },
  field: {
    delete: {
      action: "Delete Field @{{field}}",
      cancel: "Cancel",
      confirm: "Delete",
      deleting: "Deleting",
      description: "Delete @{{field}}? This is only allowed for Fields with no notes.",
      errorGeneric: "Failed to delete Field",
      errorInUse: "This Field still has notes and cannot be deleted",
      title: "Delete Field",
    },
  },
  heatmap: {
    ariaLabel: "Last {{count}} days note heatmap",
    dayLabel: "{{date}}: {{count}} notes",
    days: "{{count}} days",
    empty: "No activity stats yet",
    title: "Recent activity",
  },
  note: {
    archive: "Archive",
    unarchive: "Unarchive",
    archiveEmpty: "No archived notes",
    archiveNoMatch: "No matching archived notes",
    archiveLoading: "Loading archived notes…",
    archiveLoadFailed: "Could not load archived notes",
    archiveRetry: "Retry",
    list: "Notes",

    actions: "Note actions",
    collapse: "Collapse",
    delete: "Delete",
    deleting: "Deleting",
    edit: {
      action: "Edit note",
      cancel: "Cancel",
      saving: "Saving",
      warningMultipleFields: "Multiple fields detected. Only @{{field}} will be used.",
    },
    mention: "Mention",
    empty: "No recent notes yet",
    expand: "Expand",
    fieldMenu: {
      switch: "Switch Field: {{field}}",
    },
    linkPreview: {
      label: "Linked note {{id}}",
      loading: "Loading",
      unavailable: "Preview unavailable",
    },
    roleLabel: "Role: {{role}}",
  },
  tag: {
    delete: {
      action: "Delete Tag #{{tag}}",
      cancel: "Cancel",
      confirm: "Delete",
      description: "Delete #{{tag}}?",
      title: "Delete Tag",
    },
  },
  sort: {
    switchToOldest: "Sort oldest to newest",
    switchToNewest: "Sort newest to oldest",
  },
  search: {
    placeholder: "Search notes, Fields, Tags",
  },
  sidebar: {
    archived: "Archived",
    title: "Sidebar",
    open: "Open sidebar",
    close: "Close sidebar",
    closeOutside: "Close sidebar from outside",

    all: "All",
    allNotes: "All notes",
    collapseTag: "Collapse {{tag}}",
    emptyTags: "No tags yet",
    expandTag: "Expand {{tag}}",
    fields: "Fields",
    roles: "Roles",
    tagPathLabel: "Tag {{path}}",
    tags: "Tags",
    unknownRole: "Unknown",
  },
  stats: {
    fields: "Fields",
    notes: "Notes",
    tags: "Tags",
  },
  workspace: {
    nameInput: "Workspace name",
    rename: "Rename workspace",
    save: "Save workspace name",
  },
};
