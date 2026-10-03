import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection, type Transaction } from "@tiptap/pm/state";
import { parseFieldNames, parseTagNames } from "./homeUtils";

export interface ComposerContext {
  workspaceId: string;
  draftGeneration: number;
  kind?: "tag" | "field";
  value?: string;
}

interface OwnedRange {
  from: number;
  to: number;
  token: string;
  paragraph: boolean;
}
interface PrefillState {
  context?: ComposerContext;
  owned?: OwnedRange;
}
const key = new PluginKey<PrefillState>("composerPrefill");

/** Tracks only the text inserted by navigation, never matching user text by name. */
function mapOwned(tr: Transaction, owned?: OwnedRange): OwnedRange | undefined {
  if (!owned) return undefined;
  let { from, to } = owned;
  for (const map of tr.mapping.maps) {
    let touched = false;
    map.forEach((start, end) => {
      if (start < to && end > from || start === end && start > from && start < to) touched = true;
    });
    if (touched) return undefined;
    from = map.map(from, 1);
    to = map.map(to, -1);
  }
  if (from >= to || tr.doc.textBetween(from, to) !== owned.token) return undefined;
  const before = tr.doc.textBetween(Math.max(0, from - 1), from);
  const after = tr.doc.textBetween(to, Math.min(to + 1, tr.doc.content.size));
  if (before && !/\s/.test(before) || after && !/\s/.test(after)) return undefined;
  return { ...owned, from, to };
}

export const composerPrefillExtension = Extension.create({
  name: "composerPrefill",
  addProseMirrorPlugins() {
    return [new Plugin<PrefillState>({
      key,
      state: {
        init: () => ({}),
        apply(tr, previous) {
          const update = tr.getMeta(key) as PrefillState | undefined;
          return update ?? { ...previous, owned: mapOwned(tr, previous.owned) };
        },
      },
    })];
  },
});

export function composerNeedsReset(editor: Editor, context?: ComposerContext) {
  const previous = key.getState(editor.state)?.context;
  return !!context && !!previous && previous.draftGeneration !== context.draftGeneration;
}

/** Applies the newest navigation context without rebuilding the user's document. */
export function applyComposerContext(editor: Editor, context?: ComposerContext) {
  if (!context || editor.view.composing) return;
  const previous = key.getState(editor.state);
  const old = previous?.context;
  if (old && old.workspaceId === context.workspaceId && old.kind === context.kind &&
      old.value === context.value && old.draftGeneration === context.draftGeneration) return;

  const reset = composerNeedsReset(editor, context);
  const tr = editor.state.tr;
  const wasEmpty = !tr.doc.textContent;
  const owned = previous?.owned;
  if (reset) {
    tr.replaceWith(0, tr.doc.content.size, editor.schema.nodes.paragraph.create());
  } else if (owned) {
    const parent = tr.doc.resolve(owned.from);
    if (owned.paragraph && parent.parent.type.name === "paragraph" &&
        parent.parent.textContent === `${owned.token} ` && tr.doc.childCount > 1) {
      tr.delete(parent.before(), parent.after());
    } else {
      const hasSpace = tr.doc.textBetween(owned.to, Math.min(owned.to + 1, tr.doc.content.size)) === " ";
      tr.delete(owned.from, owned.to + (hasSpace ? 1 : 0));
    }
  }

  let nextOwned: OwnedRange | undefined;
  if (context.kind && context.value) {
    const text = tr.doc.textBetween(0, tr.doc.content.size, "\n");
    const existing = context.kind === "tag" ? parseTagNames(text) : parseFieldNames(text);
    if (!existing.includes(context.value)) {
      const token = `${context.kind === "tag" ? "#" : "@"}${context.value}`;
      const paragraph = tr.doc.firstChild?.type.name !== "paragraph";
      if (paragraph) {
        tr.insert(0, editor.schema.nodes.paragraph.create(null, editor.schema.text(`${token} `)));
      } else {
        tr.insertText(`${token} `, 1);
      }
      nextOwned = { from: 1, to: 1 + token.length, token, paragraph };
      if (reset || wasEmpty) tr.setSelection(TextSelection.create(tr.doc, token.length + 2));
    }
  }
  if (reset && !nextOwned) tr.setSelection(TextSelection.atStart(tr.doc));
  tr.setMeta(key, { context: { ...context }, owned: nextOwned } satisfies PrefillState);
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}

/** Reconciles external mention insertion without replacing unchanged prefill ranges. */
export function syncComposerMarkdown(editor: Editor, markdown: string) {
  if (!editor.markdown) return;
  const next = editor.schema.nodeFromJSON(editor.markdown.parse(markdown));
  const current = editor.state.doc;
  const start = current.content.findDiffStart(next.content);
  if (start === null) return;
  const end = current.content.findDiffEnd(next.content)!;
  const overlap = start - Math.min(end.a, end.b);
  const oldEnd = overlap > 0 ? end.a + overlap : end.a;
  const newEnd = overlap > 0 ? end.b + overlap : end.b;
  editor.view.dispatch(editor.state.tr.replace(start, oldEnd, next.slice(start, newEnd))
    .setMeta("preventUpdate", true));
}
