import type { TagDto } from "../../api/types";

export interface TagSuggestion {
  /** Text shown in the suggestion menu. */
  label: string;
  /** Full tag path inserted into the editor content without the leading hash. */
  path: string;
  /** Whether this item represents a new tag path not present in taxonomy. */
  type: "existing" | "create";
}

/** Returns tag suggestions for the current hash query. */
export function getTagSuggestions(
  query: string,
  tags: TagDto[],
): TagSuggestion[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return [];
  }

  const existing = tags
    .filter((tag) => tagMatchesQuery(tag, normalizedQuery))
    .map((tag) => ({
      label: `#${tag.path}`,
      path: tag.path,
      type: "existing" as const,
    }));

  if (existing.length > 0) {
    return existing;
  }

  return [
    {
      label: `#${query}`,
      path: query,
      type: "create",
    },
  ];
}

/** Converts supported escaped Markdown source into the note content format expected by parsers. */
export function normalizeMarkdownSource(markdown: string): string {
  return normalizeEscapedInlineCode(markdown)
    .replace(/\\#([^\s#@]+)/g, "#$1")
    .replace(
      /\\\[([^\]\n]+)\\\]\((https?:\/\/[^\s)]+)\)/g,
      "[$1]($2)",
    )
    .replace(
      /\[([^\]\n]+)\]\\*\(\[(https?:\/\/[^\]\s]+)\]\(([^\s)]+)\)\)/g,
      (match, label: string, nestedUrl: string, nestedTarget: string) => {
        const targetWithoutProtocol = nestedUrl.replace(/^https?:\/\//, "");

        return nestedTarget === nestedUrl || nestedTarget === targetWithoutProtocol
          ? `[${label}](${nestedUrl})`
          : match;
      },
    )
    .replace(/\u00a0/g, " ");
}

/** Finds a hash tag query immediately before the cursor in plain editor text. */
export function findActiveTagQuery(textBeforeCursor: string):
  | { fromOffset: number; query: string }
  | undefined {
  const match = /(?:^|\s)#([^\s#@]*)$/.exec(textBeforeCursor);

  if (!match || match[1].length === 0) {
    return undefined;
  }

  return {
    fromOffset: match.index + match[0].lastIndexOf("#"),
    query: match[1],
  };
}

/** Returns whether one taxonomy tag should appear for the current suggestion query. */
function tagMatchesQuery(tag: TagDto, query: string): boolean {
  return (
    tag.path.toLowerCase().includes(query) ||
    tag.name.toLowerCase().includes(query)
  );
}

/** Splits plain clipboard text into literal text and single-line inline code. */
export function splitInlineCodePaste(text: string): { text: string; code: boolean }[] {
  // Leave fenced snippets to the existing plain-text paste behavior.
  if (/^ {0,3}(?:`{3,}|~{3,})/m.test(text)) {
    return [{ text, code: false }];
  }

  const parts: { text: string; code: boolean }[] = [];
  let cursor = 0;
  for (const match of text.matchAll(/(?<![\\`])`([^`\r\n]+)`(?!`)/g)) {
    const start = match.index;
    if (start > cursor) parts.push({ text: text.slice(cursor, start), code: false });
    parts.push({ text: match[1], code: true });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), code: false });
  return parts;
}


/** Repairs paired code delimiters escaped by the previous plain-text editor path. */
function normalizeEscapedInlineCode(markdown: string): string {
  if (/^ {0,3}(?:`{3,}|~{3,})/m.test(markdown)) return markdown;
  return markdown.replace(/(?<![\\`])\\`([^`\r\n]+?)\\`(?!`)/g, "`$1`");
}
