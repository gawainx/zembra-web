import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { NoteEditor } from "./NoteEditor";

type EditorProps = ComponentProps<typeof NoteEditor>;

/** Positions the shared floating composer without owning page data. */
export function HomeComposer({ draft, setDraft, draftGeneration, workspaceId, selectedTag, selectedField, fieldNameById, tags, tools, onSubmit }: {
  draft: string; setDraft: (draft: string) => void; draftGeneration: number; workspaceId: string;
  selectedTag?: string; selectedField?: string; fieldNameById: Map<string, string>;
  tags: EditorProps["tags"]; tools: EditorProps["tools"]; onSubmit: () => Promise<void>;
}) {
  const { t } = useTranslation("home");
  return <>
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
            void onSubmit();
          }}
        >
          <div className="min-w-0 lg:col-start-2">
            <NoteEditor
              draft={draft}
              isSubmitting={false}
              composerContext={{
                workspaceId: workspaceId,
                draftGeneration,
                kind: selectedTag ? "tag" : selectedField ? "field" : undefined,
                value: selectedTag ?? fieldNameById.get(selectedField ?? ""),
              }}
              placeholder={t("composer.placeholder")}
              submitLabel={t("composer.send")}
              tags={tags}
              tools={tools}
              variant="floating"
              onDraftChange={setDraft}
            />
          </div>
        </form>
      </div>
  </>;
}
