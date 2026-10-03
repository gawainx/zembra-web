import { Archive, Bot, List, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FieldDto, NoteDto, TagDto } from "../../api/types";
import { NavItem, SidebarSection, TagTreeItem } from "./HomeSidebar";
import { buildTagTree, countFields, countRoles, countTags, findSelectedTagRootPath, noteMatchesTagPath } from "./homeUtils";

export function HomeNavigation({ archived = false, archivedNoteCount, onArchiveSelect, notes, roleNavigationNotes, fields, tags, selectedRole, selectedField, selectedTag, handleAllNotesSelect, handleRoleSelect, handleFieldSelect, handleTagSelect, handleTagDeleteRequest }: {
  archivedNoteCount?: number;
  archived?: boolean; onArchiveSelect?: () => void;
  notes: NoteDto[]; roleNavigationNotes: NoteDto[]; fields: FieldDto[]; tags: TagDto[];
  selectedRole?: string; selectedField?: string; selectedTag?: string;
  handleAllNotesSelect: () => void;
  handleRoleSelect: (role: string) => void;
  handleFieldSelect: (field: string) => void;
  handleTagSelect: (path: string) => void;
  handleTagDeleteRequest: (tag: TagDto) => void;
}) {
  const { t } = useTranslation("home");
  const tagUsage = useMemo(() => countTags(notes), [notes]);
  const tagTree = useMemo(() => buildTagTree(tags), [tags]);
  const fieldUsage = useMemo(() => countFields(notes), [notes]);
  const roleUsage = useMemo(
    () => countRoles(roleNavigationNotes.length > 0 ? roleNavigationNotes : notes),
    [notes, roleNavigationNotes],
  );
  const roleTotalCount = roleNavigationNotes.length > 0
    ? roleNavigationNotes.length
    : notes.length;
  const [expandedTagRoots, setExpandedTagRoots] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    const rootPath = findSelectedTagRootPath(tagTree, selectedTag);

    if (!rootPath) {
      return;
    }

    setExpandedTagRoots((current) => {
      if (current.has(rootPath)) {
        return current;
      }

      const next = new Set(current);
      next.add(rootPath);
      return next;
    });
  }, [selectedTag, tagTree]);

  /** Toggles one root tag branch in the sidebar tree. */
  function handleTagRootToggle(path: string) {
    setExpandedTagRoots((current) => {
      const next = new Set(current);

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      return next;
    });
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-4 pr-1 pt-4 lg:pb-44">
      <NavItem
        active={
          !archived && selectedRole === undefined &&
          selectedField === undefined &&
          selectedTag === undefined
        }
        count={roleTotalCount}
        label={t("sidebar.allNotes")}
        prefix={<List className="size-4" aria-hidden="true" />}
        onClick={() => void handleAllNotesSelect()}
      />
      {onArchiveSelect ? <NavItem active={archived} count={archivedNoteCount} label={t("sidebar.archived")}
        prefix={<Archive className="size-4" aria-hidden="true" />} onClick={onArchiveSelect} /> : null}
      <SidebarSection className="mt-4" title={t("sidebar.roles")}>
        {Array.from(roleUsage.entries()).map(([role, count]) => {
          const label = role || t("sidebar.unknownRole");

          return (
            <NavItem
              active={selectedRole === role}
              count={count}
              key={role || "unknown-role"}
              label={label}
              prefix={
                role === "Human" ? (
                  <User className="size-4" aria-hidden="true" />
                ) : (
                  <Bot className="size-4" aria-hidden="true" />
                )
              }
              onClick={() => void handleRoleSelect(role)}
            />
          );
        })}
      </SidebarSection>

      <SidebarSection title={t("sidebar.fields")}>
        {fields.map((field) => (
          <NavItem
            active={selectedField === field.id}
            count={fieldUsage.get(field.id) ?? 0}
            key={field.id}
            label={field.name}
            prefix="@"
            onClick={() => void handleFieldSelect(field.id)}
          />
        ))}
      </SidebarSection>

      <SidebarSection title={t("sidebar.tags")}>
        {tagTree.length === 0 ? (
          <NavItem
            active={false}
            count={0}
            disabled
            label={t("sidebar.emptyTags")}
            prefix="#"
            onClick={() => undefined}
          />
        ) : null}
        {tagTree.map((node) => (
          <TagTreeItem
            activePath={selectedTag}
            childCounts={tagUsage}
            collapsedLabel={t("sidebar.expandTag", {
              tag: node.tag.name,
            })}
            expanded={expandedTagRoots.has(node.tag.path)}
            expandedLabel={t("sidebar.collapseTag", {
              tag: node.tag.name,
            })}
            getDeleteLabel={(tag, count) =>
              count === 0 ? t("tag.delete.action", { tag: tag.path }) : undefined
            }
            key={node.tag.path}
            node={node}
            rootCount={Math.max(
              notes.filter((note) =>
                noteMatchesTagPath(note.tags, node.tag.path),
              ).length,
              (tagUsage.get(node.tag.path) ?? tagUsage.get(node.tag.name) ?? 0) +
                node.children.reduce(
                  (total, child) =>
                    total + (tagUsage.get(child.path) ?? tagUsage.get(child.name) ?? 0),
                  0,
                ),
            )}
            onDelete={handleTagDeleteRequest}
            onSelect={(path) => void handleTagSelect(path)}
            onToggle={handleTagRootToggle}
          />
        ))}
      </SidebarSection>
    </div>
  );
}
