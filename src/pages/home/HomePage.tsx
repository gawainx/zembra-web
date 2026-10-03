import { useComposerField } from "./useComposerField";
import { createComposerTools } from "./homeComposerTools";
import { TagDeleteDialog } from "./TaxonomyDeleteDialogs";
import { Input } from "../../components/ui/input";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "../../app/ThemeToggle";
import { useWorkspace } from "../../app/workspace-context";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useHomeNoteEditing } from "./useHomeNoteEditing";
import {
  SourceHomeControlsProvider,
  SourceStatusFeedback,
  SourceToolbarActions,
} from "@zembra/source-home-controls";
import { useNotesStore } from "../../features/notes/noteStore";
import type { TagDto } from "../../api/types";
import { HomeNoteFeed } from "./HomeNoteFeed";
import { HomeNavigation } from "./HomeNavigation";
import { NoteEditor } from "./NoteEditor";
import { ResponsiveSidebar } from "./ResponsiveSidebar";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import {
  DailyNotesHeatmap,
  StatBlock,
} from "./HomeSidebar";
import {
  buildTagFilterMatch,
  buildTagTree,
  filterVisibleNotes,
  parseNoteLinks,
  parseTagNames,
  sortNotesByCreatedAt,
} from "./homeUtils";

/** Renders the redesigned Zembra note workspace shell. */
export function HomePage() {
  const { i18n, t } = useTranslation("home");
  const { workspace, workspaces, switchWorkspace, renameWorkspace } = useWorkspace();
  const workspaceScope = useMemo(() => ({ active: true }), [workspace.id]);
  useEffect(() => {
    workspaceScope.active = true;
    return () => { workspaceScope.active = false; };
  }, [workspaceScope]);
  const [draft, setDraft] = useState("");
  const [draftGeneration, setDraftGeneration] = useState(0);
  const [pendingDeleteTag, setPendingDeleteTag] = useState<TagDto>();

  useEffect(() => {
    document.title = `${workspace.title} - Zembra`;
  }, [workspace.title]);

  const {
    notes,
    archivedNotes, archivedNoteCount, noteView, supportsArchiving, archiveLoading, archiveError,
    connectWorkspace, setNoteView, loadArchivedNotes, setNoteArchived,
    roleNavigationNotes,
    notePreviewById,
    dailyNoteCounts,
    fields,
    tags,
    keyword,
    selectedTag,
    selectedField,
    selectedRole,
    setKeyword,
    setSelectedTag,
    setSelectedField,
    setSelectedRole,
    createNote,
    loadDailyNoteCounts,
    loadFields,
    loadNotePreview,
    loadRecentNotes,
    loadTags,
    deleteNote,
    deleteTagTree,
    updateNote,
  } = useNotesStore();

  useLayoutEffect(() => {
    connectWorkspace();
    setDraft("");
    setPendingDeleteTag(undefined);
  }, [connectWorkspace, workspace.id]);
  const displayNotes = noteView === "archived" ? archivedNotes : notes;

  const composerTools = useMemo(
    () => createComposerTools(t),
    [t],
  );
  const fieldNameById = useMemo(
    () => new Map(fields.map((field) => [field.id, field.name])),
    [fields],
  );
  const { editingNoteId, editDraft, editWarning, setEditDraft, handleEditStart, handleEditCancel,
    handleMentionNote, handleEditSubmit, handleNoteFieldChange } = useHomeNoteEditing({
      workspaceId: workspace.id, notes: displayNotes, fieldNameById, updateNote, setComposerDraft: setDraft,
    });
  const composerField = useComposerField({
    draft, fields, notes, cachedNotes: notePreviewById, selectedField,
    workspaceId: workspace.id, loadNote: loadNotePreview,
  });
  const tagTree = useMemo(() => buildTagTree(tags), [tags]);
  const selectedTagMatch = useMemo(
    () => buildTagFilterMatch(tagTree, selectedTag),
    [selectedTag, tagTree],
  );
  const visibleNotes = useMemo(
    () =>
      sortNotesByCreatedAt(
        filterVisibleNotes(displayNotes, {
          fieldId: selectedField,
          keyword,
          tag: selectedTag,
          tagMatch: selectedTagMatch,
        }),
      ),
    [keyword, displayNotes, selectedField, selectedTag, selectedTagMatch],
  );
  useEffect(() => {
    void loadFields();
    void loadTags();
    void loadRecentNotes();
  }, [loadFields, loadRecentNotes, loadTags, workspace.id]);

  /** Persists the current composer draft as a new note. */
  async function handleCreateSubmit() {
    const content = draft.trim();

    if (!content) {
      return;
    }

    const tags = parseTagNames(content);
    const links = parseNoteLinks(content);
    const fieldPromise = composerField.resolveField();
    setDraftGeneration((generation) => generation + 1);
    const field = await fieldPromise;
    if (!workspaceScope.active) {
      console.info("[zembra] Cancelled note creation after leaving workspace", { workspaceId: workspace.id });
      return;
    }

    void createNote({
      content,
      field,
      links,
      role: "Human",
      tags,
    }).catch(() => undefined);
  }

  /** Clears every sidebar classification filter and restores all recent notes. */
  async function handleAllNotesSelect() {
    setNoteView("active");
    setSelectedField(undefined);
    setSelectedTag(undefined);

    if (selectedRole !== undefined || noteView === "archived") {
      await setSelectedRole(undefined);
    }
  }

  /** Selects one role and removes active field and tag filters. */
  async function handleRoleSelect(role: string) {
    setNoteView("active");
    setSelectedField(undefined);
    setSelectedTag(undefined);
    await setSelectedRole(role);
  }

  /** Selects one field and removes active role and tag filters. */
  async function handleFieldSelect(fieldId: string) {
    setNoteView("active");
    setSelectedTag(undefined);
    setSelectedField(fieldId);

    if (selectedRole !== undefined || noteView === "archived") {
      await setSelectedRole(undefined);
    }
  }

  /** Selects one tag and removes active role and field filters. */
  async function handleTagSelect(path: string) {
    setNoteView("active");
    setSelectedField(undefined);
    setSelectedTag(path);

    if (selectedRole !== undefined || noteView === "archived") {
      await setSelectedRole(undefined);
    }
  }

  /** Optimistically removes the pending empty tag subtree and queues deletion. */
  function handleTagDeleteConfirm() {
    if (!pendingDeleteTag) {
      return;
    }

    void deleteTagTree(pendingDeleteTag.path);
    setPendingDeleteTag(undefined);
  }

  return (
    <SourceHomeControlsProvider>
    <main className="h-screen overflow-hidden bg-[var(--color-app-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto grid h-full w-full max-w-[var(--layout-shell-max)] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-1 gap-[var(--space-4)] px-[var(--space-5)] pt-[var(--space-1)] lg:grid-cols-[minmax(var(--layout-sidebar-min),var(--layout-sidebar-max))_minmax(var(--layout-content-min),var(--layout-content-max))] lg:px-0">
        <ResponsiveSidebar header={<>
            <div className="mb-[var(--space-3)] flex items-center justify-between gap-[var(--space-3)]">
              <div className="flex min-w-0 items-center gap-[var(--space-2)] text-lg font-bold">
                <span className="text-[2em] leading-none">ℤ</span>
                <WorkspaceSwitcher
                  workspace={workspace}
                  workspaces={workspaces}
                  onWorkspaceChange={switchWorkspace}
                  onWorkspaceRename={renameWorkspace}
                />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <SourceToolbarActions />
                <ThemeToggle />
              </div>
            </div>

            <SourceStatusFeedback />

          </>}>
          <div className="shrink-0">
            <div className="mb-5 grid grid-cols-3 gap-4">
              <StatBlock label={t("stats.notes")} value={String(notes.length)} />
              <StatBlock label={t("stats.tags")} value={String(tags.length)} />
              <StatBlock label={t("stats.fields")} value={String(fields.length)} />
            </div>

            <DailyNotesHeatmap
              days={dailyNoteCounts}
              locale={i18n.resolvedLanguage}
              onDayCountChange={loadDailyNoteCounts}
              workspaceId={workspace.id}
            />
          </div>

          <HomeNavigation
            archivedNoteCount={archivedNoteCount} archived={noteView === "archived"} onArchiveSelect={supportsArchiving ? () => setNoteView("archived") : undefined}
            notes={notes} roleNavigationNotes={roleNavigationNotes} fields={fields} tags={tags}
            selectedRole={selectedRole} selectedField={selectedField} selectedTag={selectedTag}
            handleAllNotesSelect={handleAllNotesSelect} handleRoleSelect={handleRoleSelect}
            handleFieldSelect={handleFieldSelect} handleTagSelect={handleTagSelect}
            handleTagDeleteRequest={setPendingDeleteTag}
          />
        </ResponsiveSidebar>

        <section className="flex min-h-0 min-w-0 flex-col">
          <header className="mb-4 flex min-h-11 shrink-0 items-center justify-end lg:mb-3">
            <label className="flex h-[var(--control-height)] w-full items-center gap-[var(--space-2)] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-4)] text-sm text-[var(--color-text-muted)] lg:max-w-80">
              <Search className="size-4" aria-hidden="true" />
              <Input
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--color-text-muted)]"
                placeholder={t("search.placeholder")}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <span className="text-[var(--color-text-muted)]">⌘+K</span>
            </label>
          </header>

          <HomeNoteFeed
            archived={noteView === "archived"} loading={archiveLoading} failed={archiveError}
            hasKeyword={Boolean(keyword.trim())} onRetry={() => void loadArchivedNotes(true)}
            visibleNotes={visibleNotes} editingNoteId={editingNoteId} editDraft={editDraft}
            editWarning={editWarning} fieldNameById={fieldNameById}
            cardProps={{ onArchiveChange: supportsArchiving ? setNoteArchived : undefined, fields, tags, tools: composerTools, locale: i18n.resolvedLanguage,
              onDelete: deleteNote, onEditCancel: handleEditCancel, onEditDraftChange: setEditDraft,
              onEditStart: handleEditStart, onEditSubmit: handleEditSubmit, onFieldChange: handleNoteFieldChange,
              onLoadNotePreview: loadNotePreview, onMention: handleMentionNote,
              onTagSelect: (path) => void handleTagSelect(path),
            }}
          />
        </section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-5 lg:px-0">
        <div className="mx-auto grid h-[154px] w-full max-w-[var(--layout-shell-max)] grid-cols-1 gap-[var(--space-4)] lg:grid-cols-[minmax(var(--layout-sidebar-min),var(--layout-sidebar-max))_minmax(var(--layout-content-min),var(--layout-content-max))]">
          <div className="min-w-0 bg-[image:var(--color-composer-gradient)] lg:col-start-2" />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-6 z-20 px-5 lg:px-0">
        <form
          className="mx-auto grid w-full max-w-[var(--layout-shell-max)] grid-cols-1 gap-[var(--space-4)] lg:grid-cols-[minmax(var(--layout-sidebar-min),var(--layout-sidebar-max))_minmax(var(--layout-content-min),var(--layout-content-max))]"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateSubmit();
          }}
        >
          <div className="min-w-0 lg:col-start-2">
            <NoteEditor
              draft={draft}
              isSubmitting={false}
              composerContext={{
                workspaceId: workspace.id,
                draftGeneration,
                kind: selectedTag ? "tag" : selectedField ? "field" : undefined,
                value: selectedTag ?? fieldNameById.get(selectedField ?? ""),
              }}
              placeholder={t("composer.placeholder")}
              submitLabel={t("composer.send")}
              tags={tags}
              tools={composerTools}
              variant="floating"
              onDraftChange={setDraft}
            />
          </div>
        </form>
        {pendingDeleteTag ? (
          <TagDeleteDialog
            tag={pendingDeleteTag}
            t={t}
            onCancel={() => setPendingDeleteTag(undefined)}
            onConfirm={handleTagDeleteConfirm}
          />
        ) : null}
      </div>
    </main>
    </SourceHomeControlsProvider>
  );
}
