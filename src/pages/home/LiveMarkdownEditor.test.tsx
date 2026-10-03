import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Editor } from "@tiptap/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LiveMarkdownEditor } from "./LiveMarkdownEditor";

let currentEditor: Editor;
vi.mock("@tiptap/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tiptap/react")>();
  return {
    ...actual,
    EditorContent: (props: Parameters<typeof actual.EditorContent>[0]) => {
      if (props.editor) currentEditor = props.editor;
      return <actual.EditorContent {...props} />;
    },
  };
});

const tags = [
  { id: "project", name: "Project", path: "Project", depth: 0, createdAt: 1 },
  { id: "frontend", name: "frontend", path: "work/frontend", depth: 1, createdAt: 1 },
];

beforeEach(() => {
  vi.spyOn(window, "scrollBy").mockImplementation(() => {});
  // jsdom does not lay out text ranges or implement scrolling.
  Object.defineProperty(Range.prototype, "getClientRects", { configurable: true, value: () => [] });
  Object.defineProperty(Range.prototype, "getBoundingClientRect", { configurable: true, value: () => new DOMRect() });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

async function setup(variant: "floating" | "embedded" = "floating") {
  const onChange = vi.fn();
  const view = render(<LiveMarkdownEditor placeholder="Note" value="" tags={tags} variant={variant} onChange={onChange} />);
  const textbox = await screen.findByRole("textbox", { name: "Note" });
  vi.spyOn(currentEditor.view, "coordsAtPos").mockReturnValue({ left: 10, right: 10, top: 10, bottom: 20 });
  act(() => { currentEditor.commands.focus(); });
  await waitFor(() => expect(currentEditor.isFocused).toBe(true));
  return { textbox, onChange, ...view };
}

function type(text: string) {
  act(() => { currentEditor.commands.insertContent(text); });
}

test.each(["floating", "embedded"] as const)("shows all workspace tags and completes a filtered path in %s", async (variant) => {
  const { onChange } = await setup(variant);
  type("Today #");
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["#Project", "#work/frontend"]);
  type("FR");
  expect(screen.getAllByRole("option")).toHaveLength(1);
  fireEvent.mouseDown(screen.getByRole("option", { name: "#work/frontend" }));
  fireEvent.click(screen.getByRole("option", { name: "#work/frontend" }));
  expect(currentEditor.getText()).toBe("Today #work/frontend ");
  expect(onChange.mock.lastCall?.[0]).toContain("#work/frontend");
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(currentEditor.isFocused).toBe(true);
});

test("arrows move only the highlight and Enter keeps normal paragraph behavior", async () => {
  const { textbox } = await setup();
  type("Today #");
  const scroll = vi.fn();
  for (const option of screen.getAllByRole("option")) option.scrollIntoView = scroll;
  expect(screen.queryByRole("option", { selected: true })).toBeNull();
  fireEvent.keyDown(textbox, { key: "ArrowDown" });
  expect(screen.getByRole("option", { selected: true }).textContent).toBe("#Project");
  fireEvent.keyDown(textbox, { key: "ArrowDown" });
  expect(screen.getByRole("option", { selected: true }).textContent).toBe("#work/frontend");
  fireEvent.keyDown(textbox, { key: "ArrowUp" });
  expect(screen.getByRole("option", { selected: true }).textContent).toBe("#Project");
  expect(currentEditor.getText()).toBe("Today #");
  expect(textbox.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { selected: true }).id);
  expect(scroll).toHaveBeenCalled();
  fireEvent.keyDown(textbox, { key: "Enter", code: "Enter", keyCode: 13 });
  expect(currentEditor.state.doc.childCount).toBe(2);
  expect(currentEditor.getText().trim()).toBe("Today #");
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("filter changes reset highlighting and unmatched input retains create behavior", async () => {
  const { textbox } = await setup();
  type("#");
  for (const option of screen.getAllByRole("option")) option.scrollIntoView = vi.fn();
  fireEvent.keyDown(textbox, { key: "ArrowUp" });
  expect(screen.getByRole("option", { selected: true }).textContent).toBe("#work/frontend");
  type("NewTag");
  expect(screen.queryByRole("option", { selected: true })).toBeNull();
  fireEvent.click(screen.getByRole("option"));
  expect(currentEditor.getText()).toBe("#NewTag ");
});

test("composition arrow keys are left to the input method", async () => {
  const { textbox } = await setup();
  type("#");
  expect(fireEvent.keyDown(textbox, { key: "ArrowDown", isComposing: true })).toBe(true);
  expect(screen.queryByRole("option", { selected: true })).toBeNull();
});

test("refreshes open candidates when workspace tags change and closes on blur", async () => {
  const { rerender, textbox, onChange } = await setup();
  type("#");
  rerender(<LiveMarkdownEditor placeholder="Note" value="#" tags={[tags[1]]} variant="floating" onChange={onChange} />);
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["#work/frontend"]);
  fireEvent.blur(textbox);
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("completion preserves text after the cursor", async () => {
  await setup();
  type("Before #FR after");
  act(() => { currentEditor.commands.setTextSelection(11); });
  fireEvent.click(screen.getByRole("option", { name: "#work/frontend" }));
  expect(currentEditor.getText()).toBe("Before #work/frontend  after");
});
