import { render, screen } from "@testing-library/react";
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
