import { NoteLinkPreview } from "./NoteLinkPreview";
import type { Components } from "react-markdown";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { NoteDto } from "../../api/types";
import {
  fullNoteLinkPattern,
} from "./homeUtils";
import { normalizeMarkdownSource } from "./liveMarkdownEditorUtils";

const noteLinkUrlPrefix = "zembra-note://";
const tagUrlPrefix = "zembra-tag://";

interface MarkdownTextNode {
  type: "text";
  value: string;
}

interface MarkdownLinkNode {
  type: "link";
  url: string;
  title: null;
  children: MarkdownTextNode[];
}

interface MarkdownParentNode {
  children?: MarkdownNode[];
}

type MarkdownNode = MarkdownTextNode | MarkdownLinkNode | MarkdownParentNode;

/** Renders a note body with GFM Markdown and Zembra note-link previews. */
export function NoteMarkdownContent({
  content,
  onLoadNotePreview,
  onTagSelect,
}: {
  content: string;
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>;
  onTagSelect?: (path: string) => void;
}) {
  const components = createMarkdownComponents(onLoadNotePreview, onTagSelect);

  return (
    <div className="note-markdown">
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm, remarkBreaks, remarkInlineTokens]}
        urlTransform={(url) =>
          url.startsWith(noteLinkUrlPrefix) || url.startsWith(tagUrlPrefix)
            ? url
            : defaultUrlTransform(url)
        }
      >
        {normalizeMarkdownSource(content)}
      </ReactMarkdown>
    </div>
  );
}

/** Converts Zembra note references and tags in Markdown text nodes into internal links. */
function remarkInlineTokens() {
  return (tree: MarkdownNode) => {
    transformInlineTokens(tree);
  };
}

/** Walks Markdown nodes and rewrites text-node inline tokens in place. */
function transformInlineTokens(node: MarkdownNode): void {
  if (!("children" in node) || !Array.isArray(node.children)) {
    return;
  }

  node.children = repairMalformedExternalLinks(node.children).flatMap((child) => {
    if ("type" in child && child.type === "text") {
      return createInlineTokenNodes(child.value);
    }

    if ("type" in child && child.type === "link") {
      return [child];
    }

    transformInlineTokens(child);
    return [child];
  });
}

/** Reassembles the exact text-link-text node sequence produced by malformed external links. */
function repairMalformedExternalLinks(children: MarkdownNode[]): MarkdownNode[] {
  const repairedChildren: MarkdownNode[] = [];

  for (let index = 0; index < children.length; index += 1) {
    const previous = children[index];
    const link = children[index + 1];
    const following = children[index + 2];

    if (
      !isTextNode(previous) ||
      !isLinkNode(link) ||
      !isTextNode(following)
    ) {
      repairedChildren.push(previous);
      continue;
    }

    const match = /\[([^\]\n]+)\]\($/.exec(previous.value);

    if (
      !match ||
      !following.value.startsWith(")") ||
      link.children.length !== 1 ||
      link.children[0].value !== link.url ||
      !/^https?:\/\//.test(link.url)
    ) {
      repairedChildren.push(previous);
      continue;
    }

    appendTextNode(
      repairedChildren,
      previous.value.slice(0, previous.value.length - match[0].length),
    );
    repairedChildren.push({
      type: "link",
      url: link.url,
      title: null,
      children: [{ type: "text", value: match[1] }],
    });
    appendTextNode(repairedChildren, following.value.slice(1));
    index += 2;
  }

  return repairedChildren;
}

/** Returns whether a Markdown node is a text node. */
function isTextNode(node: MarkdownNode | undefined): node is MarkdownTextNode {
  return node !== undefined && "type" in node && node.type === "text";
}

/** Returns whether a Markdown node is an external link node. */
function isLinkNode(node: MarkdownNode | undefined): node is MarkdownLinkNode {
  return node !== undefined && "type" in node && node.type === "link";
}

/** Splits one text node into plain text, internal note-link, and tag nodes. */
function createInlineTokenNodes(value: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = [];
  const tokenPattern = new RegExp(
    `${fullNoteLinkPattern.source}|(^|\\s)#([^\\s#@]+)`,
    "g",
  );
  let cursor = 0;

  for (const match of value.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    const noteRef = match[1];
    const tag = match[3];
    const tokenStart = noteRef ? index : index + (match[2]?.length ?? 0);

    appendTextNode(nodes, value.slice(cursor, tokenStart));

    if (noteRef) {
      nodes.push(createInternalLinkNode(noteLinkUrlPrefix, noteRef));
    } else if (tag) {
      nodes.push(createInternalLinkNode(tagUrlPrefix, tag));
    }

    cursor = index + match[0].length;
  }

  appendTextNode(nodes, value.slice(cursor));
  return nodes;
}

/** Adds a non-empty text node to a Markdown node collection. */
function appendTextNode(nodes: MarkdownNode[], value: string): void {
  if (value) {
    nodes.push({ type: "text", value });
  }
}

/** Creates one internal link node used by the Markdown component mapping. */
function createInternalLinkNode(prefix: string, value: string): MarkdownLinkNode {
  return {
    type: "link",
    url: `${prefix}${value}`,
    title: null,
    children: [{ type: "text", value }],
  };
}

/** Creates Markdown element renderers bound to the note preview loader. */
function createMarkdownComponents(
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>,
  onTagSelect?: (path: string) => void,
): Components {
  return {
    a({ children, href }) {
      if (href?.startsWith(noteLinkUrlPrefix)) {
        return (
          <NoteLinkPreview
            noteRef={href.slice(noteLinkUrlPrefix.length)}
            onLoadNotePreview={onLoadNotePreview}
          />
        );
      }

      if (href?.startsWith(tagUrlPrefix)) {
        if (onTagSelect) {
          return (
            <button
              className="note-tag-chip cursor-pointer whitespace-nowrap"
              type="button"
              onClick={() => onTagSelect(String(children))}
            >
              #{children}
            </button>
          );
        }
        return <span className="note-tag-chip">#{children}</span>;
      }

      return (
        <a
          className="text-[var(--color-field)] underline"
          href={href}
          rel="noreferrer"
          target="_blank"
        >
          {children}
        </a>
      );
    },
    code({ children, className }) {
      const isBlock = className?.startsWith("language-");

      if (isBlock) {
        return <code className={className}>{children}</code>;
      }

      return <code>{children}</code>;
    },
    input(props) {
      return <input {...props} readOnly />;
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto">
          <table>{children}</table>
        </div>
      );
    },
  };
}

/** Renders one compact note reference with hover preview content. */
