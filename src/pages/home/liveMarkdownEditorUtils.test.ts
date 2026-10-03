import { splitInlineCodePaste } from "./liveMarkdownEditorUtils";
import { describe, expect, test } from "vitest";
import {
  findActiveTagQuery,
  getTagSuggestions,
  normalizeMarkdownSource,
} from "./liveMarkdownEditorUtils";

const tags = [
  {
    id: "tag-books",
    name: "books",
    path: "books",
    depth: 0,
    createdAt: 1,
  },
  {
    id: "tag-gpt",
    name: "hands-on-gpt",
    path: "books/hands-on-gpt",
    parentTagId: "tag-books",
    depth: 1,
    createdAt: 2,
  },
];

describe("getTagSuggestions", () => {
  test("matches prefixes case-insensitively but not middle substrings", () => {
    expect(getTagSuggestions("HANDS", tags)[0].path).toBe("books/hands-on-gpt");
    expect(getTagSuggestions("BOOKS/HA", tags)[0].path).toBe("books/hands-on-gpt");
    expect(getTagSuggestions("gpt", tags)[0].type).toBe("create");
    expect(getTagSuggestions("ook", tags)[0].type).toBe("create");
  });

  test("sorts full paths without mutating the workspace tags", () => {
    const reversed = [...tags].reverse();
    expect(getTagSuggestions("", reversed).map((tag) => tag.path)).toEqual(tags.map((tag) => tag.path));
    expect(reversed[0].path).toBe("books/hands-on-gpt");
  });
  test("shows all tags for an empty hash query", () => {
    expect(getTagSuggestions("", tags).map((tag) => tag.path)).toEqual(["books", "books/hands-on-gpt"]);
    expect(getTagSuggestions("", [])).toEqual([]);
  });

  test("matches existing tags by full path and leaf name", () => {
    expect(getTagSuggestions("books/han", tags)).toEqual([
      {
        label: "#books/hands-on-gpt",
        path: "books/hands-on-gpt",
        type: "existing",
      },
    ]);
    expect(getTagSuggestions("hands", tags)).toEqual([
      {
        label: "#books/hands-on-gpt",
        path: "books/hands-on-gpt",
        type: "existing",
      },
    ]);
  });

  test("returns a create suggestion when no tag matches", () => {
    expect(getTagSuggestions("new-tag", tags)).toEqual([
      {
        label: "#new-tag",
        path: "new-tag",
        type: "create",
      },
    ]);
  });
});

describe("findActiveTagQuery", () => {
  test.each(["text#tag", "##", "#tag ", "#tag@field"])("preserves trigger boundaries: %s", (text) => {
    expect(findActiveTagQuery(text)).toBeUndefined();
  });
  test("finds a non-empty tag query before the cursor", () => {
    expect(findActiveTagQuery("hello #hand")).toEqual({
      fromOffset: 6,
      query: "hand",
    });
  });

  test("recognizes a bare hash", () => {
    expect(findActiveTagQuery("hello #")).toEqual({ fromOffset: 6, query: "" });
  });
});

describe("normalizeMarkdownSource", () => {
  test("keeps hash tag markers parseable after markdown serialization", () => {
    expect(normalizeMarkdownSource("\\#books/hands-on-gpt\nnext")).toBe(
      "#books/hands-on-gpt\nnext",
    );
  });

  test("repairs the escaped link delimiters emitted by the editor", () => {
    expect(
      normalizeMarkdownSource(
        "#cuda \\[foundry-org/foundry: Foundry materializes CUDA graphs along with its execution context to disk to support fast cold start of serving engines.\\](https://github.com/foundry-org/foundry) 这篇论文，离线固化图拓扑，并且有github可以参考",
      ),
    ).toBe(
      "#cuda [foundry-org/foundry: Foundry materializes CUDA graphs along with its execution context to disk to support fast cold start of serving engines.](https://github.com/foundry-org/foundry) 这篇论文，离线固化图拓扑，并且有github可以参考",
    );
  });

  test("repairs an observed nested link whose target omits the protocol", () => {
    expect(
      normalizeMarkdownSource(
        "[Foundry]([https://github.com/foundry-org/foundry](github.com/foundry-org/foundry))",
      ),
    ).toBe("[Foundry](https://github.com/foundry-org/foundry)");
  });

  test("repairs the full escaped link content reported from a note card", () => {
    expect(
      normalizeMarkdownSource(
        "#cuda [foundry-org/foundry: Foundry materializes CUDA graphs along with its execution context to disk to support fast cold start of serving engines.]([https://github.com/foundry-org/foundry](github.com/foundry-org/foundry)) 这篇论文，离线固化图拓扑，并且有github可以参考",
      ),
    ).toBe(
      "#cuda [foundry-org/foundry: Foundry materializes CUDA graphs along with its execution context to disk to support fast cold start of serving engines.](https://github.com/foundry-org/foundry) 这篇论文，离线固化图拓扑，并且有github可以参考",
    );
  });

  test("keeps nested links with distinct display text unchanged", () => {
    const markdown = "[Foundry]([project page](github.com/foundry-org/foundry))";

    expect(normalizeMarkdownSource(markdown)).toBe(markdown);
  });
});


describe("splitInlineCodePaste", () => {
  test("recognizes inline code while leaving surrounding Markdown literal", () => {
    expect(splitInlineCodePaste("**text** `const x = 1` end")).toEqual([
      { text: "**text** ", code: false },
      { text: "const x = 1", code: true },
      { text: " end", code: false },
    ]);
  });

  test.each(["`unfinished", "``literal``", "`two\nlines`", "\\`escaped`", "```js\n`literal`\n```"])(
    "keeps unsupported or escaped delimiters literal: %s", (text) => {
      expect(splitInlineCodePaste(text)).toEqual([{ text, code: false }]);
    },
  );
});


test("repairs paired escaped inline code without changing unmatched delimiters", () => {
  expect(normalizeMarkdownSource("\\`test\\`")).toBe("`test`");
  expect(normalizeMarkdownSource("\\`unfinished")).toBe("\\`unfinished");
});
