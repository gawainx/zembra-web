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

async function setupPrefill(initial: import("./composerPrefillExtension").ComposerContext, value = "") {
  let context = initial;
  let markdown = value;
  const onChange = vi.fn((next: string) => { markdown = next; });
  const element = () => <LiveMarkdownEditor placeholder="Note" value={markdown} tags={tags} variant="floating" composerContext={context} onChange={onChange} />;
  const view = render(element());
  const textbox = await screen.findByRole("textbox", { name: "Note" });
  vi.spyOn(currentEditor.view, "coordsAtPos").mockReturnValue({ left: 10, right: 10, top: 10, bottom: 20 });
  return {
    textbox, onChange,
    update(next: Partial<typeof context> = {}) { context = { ...context, ...next }; view.rerender(element()); },
  };
}
const initialContext = { workspaceId: "workspace", draftGeneration: 0, kind: "tag" as const, value: "books/AI" };

test("navigation replaces only prefill and retains handwritten matching tags and selections", async () => {
  const { update, onChange } = await setupPrefill(initialContext);
  expect(currentEditor.getText()).toBe("#books/AI ");
  type("Body #books/AI @personal");
  update({ value: "books/design" });
  expect(currentEditor.getText()).toBe("#books/design Body #books/AI @personal");
  type(" tail");
  expect(currentEditor.getText()).toBe("#books/design Body #books/AI @personal tail");
  update({ kind: "field", value: "work" });
  expect(currentEditor.getText()).toBe("@work Body #books/AI @personal tail");
  update({ kind: undefined, value: undefined });
  expect(currentEditor.getText()).toBe("Body #books/AI @personal tail");
  expect(onChange.mock.lastCall?.[0]).toContain("Body #books/AI @personal tail");
});

test("manual removal stays removed until context changes and changed tokens become user content", async () => {
  const { update } = await setupPrefill(initialContext);
  act(() => { currentEditor.commands.deleteRange({ from: 1, to: 11 }); });
  type("Body");
  update();
  expect(currentEditor.getText()).toBe("Body");
  update({ value: "next" });
  expect(currentEditor.getText()).toBe("#next Body");
  act(() => { currentEditor.commands.insertContentAt({ from: 2, to: 6 }, "mine"); });
  update({ value: "third" });
  expect(currentEditor.getText()).toBe("#third #mine Body");
});

test("does not adopt duplicate user tags and preserves structured Markdown", async () => {
  const { update } = await setupPrefill(initialContext, "# Heading\n\n- item\n\n```js\nconst x = 1;\n```");
  expect(currentEditor.state.doc.child(1).type.name).toBe("heading");
  update({ value: "other" });
  expect(currentEditor.getMarkdown()).toContain("# Heading");
  expect(currentEditor.getMarkdown()).toContain("const x = 1;");
  update({ kind: undefined, value: undefined });
  expect(currentEditor.state.doc.firstChild?.type.name).toBe("heading");
});

test("reuses a handwritten classification without taking ownership", async () => {
  const { update } = await setupPrefill(initialContext, "Body #books/AI");
  expect(currentEditor.getText()).toBe("Body #books/AI");
  update({ value: "other" });
  expect(currentEditor.getText()).toBe("#other Body #books/AI");
});

test("new draft generation resets even identical prefill and permits continued typing", async () => {
  const { update } = await setupPrefill(initialContext);
  update({ draftGeneration: 1 });
  type("next body");
  expect(currentEditor.getText()).toBe("#books/AI next body");
  update({ draftGeneration: 2 });
  expect(currentEditor.getText()).toBe("#books/AI ");
  type("another");
  update();
  expect(currentEditor.getText()).toBe("#books/AI another");
});

test("undo and redo preserve the current navigation prefill", async () => {
  const { update } = await setupPrefill(initialContext);
  type("Body");
  update({ value: "next" });
  act(() => { currentEditor.commands.undo(); });
  expect(currentEditor.getText()).toBe("#next ");
  act(() => { currentEditor.commands.redo(); });
  expect(currentEditor.getText()).toBe("#next Body");
  update({ value: "last" });
  expect(currentEditor.getText()).toBe("#last Body");
});

test("composition defers prefill until the input method finishes", async () => {
  const { update, textbox } = await setupPrefill(initialContext);
  fireEvent.compositionStart(textbox);
  type("正文");
  update({ value: "next" });
  expect(currentEditor.getText()).toBe("#books/AI 正文");
  fireEvent.compositionEnd(textbox);
  await waitFor(() => expect(currentEditor.getText()).toBe("#next 正文"));
});

test("editing the end of a prefilled token retains that user change on navigation", async () => {
  const { update } = await setupPrefill(initialContext);
  act(() => { currentEditor.commands.insertContentAt(10, "-edited"); });
  update({ value: "next" });
  expect(currentEditor.getText()).toBe("#next #books/AI-edited ");
});

test("switching workspaces drops the previous owned classification", async () => {
  const { update } = await setupPrefill(initialContext);
  type("Body");
  update({ workspaceId: "another", kind: "field", value: "work" });
  expect(currentEditor.getText()).toBe("@work Body");
  update({ value: "research" });
  expect(currentEditor.getText()).toBe("@research Body");
});
