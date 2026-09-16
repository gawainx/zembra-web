import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { expect, test } from "vitest";
import { normalizeMarkdownSource } from "./liveMarkdownEditorUtils";

/** Reproduces the previous insertion path instead of assuming the stored Markdown shape. */
test("recovers code delimiters escaped by plain text insertion", () => {
  const editor = new Editor({ extensions: [StarterKit, Markdown] });
  try {
    editor.view.dispatch(editor.state.tr.insertText("`test`"));
    expect(editor.getMarkdown()).toBe("\\`test\\`");
    editor.commands.setContent(normalizeMarkdownSource(editor.getMarkdown()), { contentType: "markdown" });
    expect(editor.getHTML()).toBe("<p><code>test</code></p>");
    expect(editor.getMarkdown()).toBe("`test`");
  } finally { editor.destroy(); }
});

/** Uses ProseMirror input handlers to exercise real incremental typing rules. */
test("converts typed backticks to inline code and serializes the code mark", () => {
  const editor = new Editor({ extensions: [StarterKit, Markdown] });
  try {
    for (const character of "`test`") {
      const { from, to } = editor.state.selection;
      const handled = editor.view.someProp("handleTextInput", (handler) =>
        handler(editor.view, from, to, character, () => editor.state.tr.insertText(character, from, to)),
      );
      if (!handled) editor.view.dispatch(editor.state.tr.insertText(character, from, to));
    }
    expect(editor.getHTML()).toBe("<p><code>test</code></p>");
    expect(editor.getMarkdown()).toBe("`test`");
  } finally { editor.destroy(); }
});
