import { CalendarDays, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { MouseEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { DailyNoteCount } from "../../api/types";
import type { TagTreeNode } from "./homeUtils";
import { formatHeatmapDate, getHeatmapLevel } from "./homeUtils";

/** Renders a single statistic block in the sidebar. */
export function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[30px] font-bold leading-none text-[var(--color-text-secondary)]">
        {value}
      </div>
      <div className="mt-2 text-[13px] text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}

/** Renders the recent daily note count calendar heatmap in the sidebar. */
export function DailyNotesHeatmap({
  days,
  locale = "zh-CN",
}: {
  days: DailyNoteCount[];
  locale?: string;
}) {
  const { t } = useTranslation("home");
  const maxCount = Math.max(0, ...days.map((day) => day.count));

  if (days.length === 0) {
    return (
      <section
        aria-label={t("heatmap.ariaLabel")}
        className="hidden w-[300px] rounded-[var(--radius-surface)] border border-dashed border-[var(--color-border)] p-[var(--space-3)] text-sm text-[var(--color-text-muted)] lg:block"
      >
        {t("heatmap.empty")}
      </section>
    );
  }

  return (
    <section
      aria-label={t("heatmap.ariaLabel")}
      className="hidden w-[300px] lg:block"
    >
      <div className="mb-[var(--space-2)] flex items-center justify-between gap-[var(--space-3)] text-[13px] text-[var(--color-text-muted)]">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
          <span className="truncate">{t("heatmap.title")}</span>
        </span>
        <span className="shrink-0">{t("heatmap.days", { count: days.length })}</span>
      </div>
      <div className="grid grid-flow-col grid-rows-5 gap-[var(--space-2)]">
        {days.map((day) => {
          const level = getHeatmapLevel(day.count, maxCount);
          const label = t("heatmap.dayLabel", {
            count: day.count,
            date: formatHeatmapDate(day.date, locale),
          });

          return (
            <span
              aria-label={label}
              className="flex h-9 min-w-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] text-[10px] font-semibold leading-none text-[var(--color-text-muted)] data-[level='1']:bg-[var(--color-heatmap-level-1)] data-[level='2']:bg-[var(--color-heatmap-level-2)] data-[level='3']:bg-[var(--color-heatmap-level-3)] data-[level='4']:border-[var(--color-accent)] data-[level='4']:bg-[var(--color-accent)] data-[level='4']:text-[var(--color-accent-contrast)]"
              data-level={level}
              key={day.date}
              title={label}
            >
              {Number(day.date.slice(-2))}
            </span>
          );
        })}
      </div>
      <div className="mt-[var(--space-2)] flex justify-between text-[12px] text-[var(--color-text-muted)]">
        <span>{formatHeatmapDate(days[0]?.date, locale)}</span>
        <span>{formatHeatmapDate(days.at(-1)?.date, locale)}</span>
      </div>
    </section>
  );
}

/** Renders a titled sidebar navigation section. */
export function SidebarSection({
  children,
  className = "mt-6",
  title,
}: {
  children: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-[var(--space-3)] text-xs font-normal tracking-[0.02em] text-[var(--color-warm)]">
        {title}
      </h2>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

/** Renders a sidebar navigation row for fields, tags, or roles. */
export function NavItem({
  active,
  count,
  deleteDisabled = false,
  deleteLabel,
  disabled = false,
  label,
  onClick,
  onDelete,
  prefix,
  tone = "default",
}: {
  active: boolean;
  count: number;
  deleteDisabled?: boolean;
  deleteLabel?: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  onDelete?: () => void;
  prefix: ReactNode;
  /** Visual semantic applied to a field navigation row. */
  tone?: "default" | "field";
}) {
  const canDelete = Boolean(onDelete && deleteLabel);
  const isFieldTone = tone === "field";

  /** Runs the optional delete action without selecting the navigation row. */
  function handleDeleteClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onDelete?.();
  }

  return (
    <div
      className={`group/nav grid min-h-9 grid-cols-[24px_1fr_28px] items-center gap-[var(--space-2)] rounded-[var(--radius-control)] px-[var(--space-3)] py-[var(--space-2)] text-left text-[15px] hover:bg-[var(--color-surface-muted)] data-[disabled=true]:opacity-45 data-[disabled=true]:hover:bg-transparent ${isFieldTone ? "text-[var(--color-field)] data-[active=true]:bg-[var(--color-accent-soft)] data-[active=true]:text-[var(--color-accent)]" : "text-[var(--color-text-secondary)] data-[active=true]:bg-[var(--color-accent-soft)] data-[active=true]:text-[var(--color-text-primary)]"}`}
      data-active={active}
      data-disabled={disabled}
    >
      <button
        className="col-span-2 grid min-w-0 grid-cols-[24px_1fr] items-center gap-[var(--space-2)] text-left disabled:cursor-default"
        disabled={disabled}
        type="button"
        onClick={onClick}
      >
        <span className={`flex min-w-0 items-center justify-center text-center text-lg font-bold leading-none ${isFieldTone ? "text-[var(--color-field)] group-data-[active=true]/nav:text-[var(--color-accent)]" : "text-[var(--color-accent)]"}`}>
          {prefix}
        </span>
        <span className="min-w-0 truncate">{label}</span>
      </button>
      <span className="flex min-w-0 items-center justify-end">
        {canDelete ? (
          <>
            <span className="text-xs text-[var(--color-text-muted)] group-hover/nav:hidden group-focus-within/nav:hidden">
              {count}
            </span>
            <button
              aria-label={deleteLabel}
              className="hidden size-[var(--icon-hit-size)] items-center justify-center rounded-[var(--radius-control)] text-[var(--color-error)] hover:bg-[var(--color-error-soft)] disabled:cursor-not-allowed disabled:opacity-60 group-hover/nav:flex group-focus-within/nav:flex"
              disabled={deleteDisabled}
              type="button"
              onClick={handleDeleteClick}
            >
              <Trash2 className="size-[var(--icon-size)]" aria-hidden="true" />
            </button>
          </>
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">{count}</span>
        )}
      </span>
    </div>
  );
}

/** Renders one root tag with optional second-level child tags. */
export function TagTreeItem({
  activePath,
  childCounts,
  collapsedLabel,
  expanded,
  expandedLabel,
  node,
  onSelect,
  onToggle,
  rootCount,
}: {
  activePath?: string;
  childCounts: Map<string, number>;
  collapsedLabel: string;
  expanded: boolean;
  expandedLabel: string;
  node: TagTreeNode;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
  rootCount: number;
}) {
  const hasChildren = node.children.length > 0;

  if (!hasChildren) {
    return (
      <NavItem
        active={activePath === node.tag.path}
        count={rootCount}
        label={node.tag.name}
        prefix="#"
        onClick={() => onSelect(node.tag.path)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        className="group grid min-h-9 grid-cols-[24px_1fr_auto] items-center gap-[var(--space-2)] rounded-[var(--radius-control)] px-[var(--space-3)] py-[var(--space-2)] text-left text-[15px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] data-[active=true]:bg-[var(--color-accent-soft)] data-[active=true]:text-[var(--color-text-primary)]"
        data-active={activePath === node.tag.path}
      >
        <button
          aria-expanded={expanded}
          aria-label={expanded ? expandedLabel : collapsedLabel}
          className="flex min-w-0 items-center justify-center rounded-[7px] text-[var(--color-accent)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
          type="button"
          onClick={() => onToggle(node.tag.path)}
        >
          <span className="text-lg font-bold leading-none group-hover:hidden group-focus-within:hidden">
            #
          </span>
          <span className="hidden group-hover:flex group-focus-within:flex">
            {expanded ? (
              <ChevronDown className="size-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-4" aria-hidden="true" />
            )}
          </span>
        </button>
        <button
          className="min-w-0 truncate text-left"
          type="button"
          onClick={() => onSelect(node.tag.path)}
        >
          {node.tag.name}
        </button>
        <span className="text-xs text-[var(--color-text-muted)]">{rootCount}</span>
      </div>
      {hasChildren && expanded ? (
        <div className="ml-6 flex flex-col gap-1">
          {node.children.map((child) => (
            <NavItem
              active={activePath === child.path}
              count={childCounts.get(child.path) ?? childCounts.get(child.name) ?? 0}
              key={child.path}
              label={child.name}
              prefix="#"
              onClick={() => onSelect(child.path)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
