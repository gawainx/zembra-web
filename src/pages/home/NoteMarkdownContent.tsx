import type { Components } from "react-markdown";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import { useTranslation } from "react-i18next";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { useRef, useState, type ReactNode } from "react";
import type { NoteDto } from "../../api/types";
import {
  formatShortNoteRef,
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
}: {
  content: string;
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>;
}) {
  const components = createMarkdownComponents(onLoadNotePreview);

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
        return <span className="note-tag-chip">#{href.slice(tagUrlPrefix.length)}</span>;
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
function NoteLinkPreview({
  noteRef,
  onLoadNotePreview,
}: {
  noteRef: string;
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>;
}) {
  const { t } = useTranslation("home");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<NoteDto>();
  const [hasError, setHasError] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ left: 0, top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  /** Loads preview content when the user inspects this note reference. */
  async function handlePreviewOpen() {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (rect) {
      setPreviewPosition({
        left: Math.min(rect.left, window.innerWidth - 304),
        top: rect.bottom + 6,
      });
    }

    setIsOpen(true);

    if (preview || isLoading) {
      return;
    }

    setIsLoading(true);
    setHasError(false);
    try {
      setPreview(await onLoadNotePreview(noteRef));
    } catch (error) {
      console.error("Failed to load note link preview", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  /** Hides the hover preview without clearing cached content. */
  function handlePreviewClose() {
    setIsOpen(false);
  }

  return (
    <span className="relative inline-flex">
      <button
        aria-label={t("note.linkPreview.label", {
          id: formatShortNoteRef(noteRef),
        })}
        className="mx-0.5 inline-flex h-[24px] items-center rounded-[7px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1.5 text-[13px] font-semibold text-[var(--color-accent)] hover:border-[var(--color-accent)]"
        onBlur={handlePreviewClose}
        onFocus={() => void handlePreviewOpen()}
        onMouseEnter={() => void handlePreviewOpen()}
        onMouseLeave={handlePreviewClose}
        ref={buttonRef}
        type="button"
      >
        {formatShortNoteRef(noteRef)}
      </button>
      {isOpen ? (
        <div
          className="fixed z-40 block w-72 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-left text-sm leading-6 text-[var(--color-text-primary)] shadow-[var(--color-shadow-float)]"
          style={{
            left: `${Math.max(8, previewPosition.left)}px`,
            top: `${previewPosition.top}px`,
          }}
        >
          {renderPreviewContent({
            hasError,
            isLoading,
            loadingLabel: t("note.linkPreview.loading"),
            previewContent: preview?.content,
            onLoadNotePreview,
            unavailableLabel: t("note.linkPreview.unavailable"),
          })}
        </div>
      ) : null}
    </span>
  );
}

/** Returns the visible text for the note-link preview bubble. */
function renderPreviewContent({
  hasError,
  isLoading,
  loadingLabel,
  onLoadNotePreview,
  previewContent,
  unavailableLabel,
}: {
  hasError: boolean;
  isLoading: boolean;
  loadingLabel: string;
  onLoadNotePreview: (noteRef: string) => Promise<NoteDto>;
  previewContent?: string;
  unavailableLabel: string;
}): ReactNode {
  if (isLoading) {
    return loadingLabel;
  }

  if (hasError) {
    return unavailableLabel;
  }

  return previewContent !== undefined ? (
    <NoteMarkdownContent
      content={previewContent}
      onLoadNotePreview={onLoadNotePreview}
    />
  ) : (
    unavailableLabel
  );
}
