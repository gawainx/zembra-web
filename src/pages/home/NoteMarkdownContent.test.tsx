import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { NoteMarkdownContent } from "./NoteMarkdownContent";

/** Verifies Unicode tag labels remain readable after Markdown link transformation. */
test("renders Unicode tag labels without exposing URI encoding", () => {
  const { container } = render(
    <NoteMarkdownContent
      content="跟进 #自动化寻优 和 #研发/AI工具"
      onLoadNotePreview={vi.fn()}
    />,
  );

  expect(screen.getByText("#自动化寻优")).not.toBeNull();
  expect(screen.getByText("#研发/AI工具")).not.toBeNull();
  expect(container.textContent).not.toContain("%E8");
});

/** Keeps existing ASCII tags on the same visible rendering path. */
test("keeps ASCII tag labels readable", () => {
  render(
    <NoteMarkdownContent
      content="Review #automation"
      onLoadNotePreview={vi.fn()}
    />,
  );

  expect(screen.getByText("#automation")).not.toBeNull();
});


/** Inline code is rendered as literal code, including Markdown and tag characters. */
test("renders inline code without converting its contents to tags or emphasis", () => {
  const { container } = render(
    <NoteMarkdownContent content="Use `#literal **text**` now" onLoadNotePreview={vi.fn()} />,
  );
  const code = container.querySelector("code");
  expect(code?.textContent).toBe("#literal **text**");
  expect(code?.children.length).toBe(0);
  expect(container.textContent).toBe("Use #literal **text** now");
});

/** Keeps the displayed Unicode path intact for pointer and keyboard activation. */
test("selects complete tag paths with pointer and keyboard", async () => {
  const user = userEvent.setup();
  const onTagSelect = vi.fn();
  render(<NoteMarkdownContent content="Read #研发/AI工具 and #books" onLoadNotePreview={vi.fn()} onTagSelect={onTagSelect} />);
  await user.click(screen.getByRole("button", { name: "#研发/AI工具" }));
  expect(onTagSelect).toHaveBeenLastCalledWith("研发/AI工具");
  await user.tab();
  await user.keyboard("{Enter}");
  expect(onTagSelect).toHaveBeenLastCalledWith("books");
});

/** A card callback must not turn nested preview tags into navigation controls. */
test("keeps tags inside note previews non-interactive", async () => {
  const user = userEvent.setup();
  const onTagSelect = vi.fn();
  render(<NoteMarkdownContent content="[[550e8400-e29b-41d4-a716-446655440000]]" onTagSelect={onTagSelect} onLoadNotePreview={vi.fn().mockResolvedValue({ content: "Preview #nested" })} />);
  await user.hover(screen.getByRole("button"));
  const tag = await screen.findByText("#nested");
  await user.click(tag);
  expect(screen.queryByRole("button", { name: "#nested" })).toBeNull();
  expect(onTagSelect).not.toHaveBeenCalled();
});
