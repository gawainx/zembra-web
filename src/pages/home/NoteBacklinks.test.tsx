import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import type { NoteDto } from "../../api/types";
import { useNotesStore } from "../../features/notes/noteStore";
import { NoteBacklinks } from "./NoteBacklinks";
import { i18next as i18n } from "../../i18n";

const sources: NoteDto[] = [3, 2, 1].map((i) => ({ id: `source-${i}`, content: `正文${i} [[target]]`, createdAt: i * 86400, updatedAt: i * 86400, role: "Human", tags: [] }));
const props = { noteId: "target", locale: "zh-CN", onLoadNotePreview: vi.fn() };
beforeEach(async () => {
  await i18n.changeLanguage("zh-CN");
  useNotesStore.setState(useNotesStore.getInitialState(), true);
  useNotesStore.setState({ loadBacklinks: vi.fn(async () => {}), backlinksByNoteId: { target: sources }, backlinkStatus: { target: "ready" } });
});

test("shows two sources, expands all and collapses independently of other cards", async () => {
  const user = userEvent.setup();
  useNotesStore.setState({ backlinksByNoteId: { target: sources, other: sources } });
  render(<><NoteBacklinks {...props} /><NoteBacklinks {...props} noteId="other" /></>);
  const toggles = screen.getAllByRole("button", { name: "被 3 条笔记引用" });
  const lists = screen.getAllByRole("list");
  expect(within(lists[0]).getAllByRole("listitem")).toHaveLength(2);
  expect(toggles[0].getAttribute("aria-expanded")).toBe("false");
  await user.click(toggles[0]);
  expect(within(lists[0]).getAllByRole("listitem")).toHaveLength(3);
  expect(within(lists[1]).getAllByRole("listitem")).toHaveLength(2);
  await user.click(toggles[0]);
  expect(within(lists[0]).getAllByRole("listitem")).toHaveLength(2);
});

test.each([0, 1, 2])("hides empty lists and shows all %i sources without a collapse button", (count) => {
  useNotesStore.setState({ backlinksByNoteId: { target: sources.slice(0, count) } });
  render(<NoteBacklinks {...props} />);
  expect(screen.queryAllByRole("listitem")).toHaveLength(count);
  expect(screen.queryByRole("button", { name: /被 .* 条笔记引用/ })).toBeNull();
  if (!count) expect(screen.queryByRole("list")).toBeNull();
});

test("uses literal prefix and date while hover shows full current content without another read", async () => {
  const user = userEvent.setup();
  const content = "正文\n" + "字".repeat(140) + "结尾内容";
  useNotesStore.setState({ backlinksByNoteId: { target: [{ ...sources[0], content }] } });
  const onLoadNotePreview = vi.fn();
  render(<NoteBacklinks {...props} onLoadNotePreview={onLoadNotePreview} />);
  const row = screen.getByRole("button");
  expect(row.textContent).toContain("1970/1/4: 正文 ");
  expect(row.textContent).not.toContain("结尾内容");
  await user.hover(row);
  expect(screen.getByRole("tooltip").textContent).toContain("结尾内容");
  expect(onLoadNotePreview).not.toHaveBeenCalled();
  act(() => useNotesStore.setState({ backlinksByNoteId: { target: [{ ...sources[0], content: "最新正文" }] } }));
  expect(screen.getByRole("tooltip").textContent).toBe("最新正文");
  await user.keyboard("{Escape}");
});

test("loads lazily on mount and retries a local failure", async () => {
  const user = userEvent.setup(); const load = vi.fn(async () => {});
  useNotesStore.setState({ loadBacklinks: load, backlinksByNoteId: {}, backlinkStatus: { target: "error" } });
  render(<NoteBacklinks {...props} />);
  expect(load).toHaveBeenCalledWith("target");
  expect(screen.getByRole("alert").textContent).toContain("无法加载被引用列表");
  await user.click(screen.getByRole("button", { name: "重试" }));
  expect(load).toHaveBeenLastCalledWith("target", true);
});
