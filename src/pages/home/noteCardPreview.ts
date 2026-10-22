/** Text lines shown before a note card offers collapse. */
const visibleLineCount = 3;

export interface NoteCardPreviewBox {
  top: number;
  bottom: number;
}

export interface NoteCardPreviewDecision {
  /** Whether the rendered note extends past the third visible line. */
  hasOverflow: boolean;
  /** Collapsed height in pixels, measured from the preview container top. */
  collapsedMaxHeight?: number;
}

/** Decides note-card collapse from rendered line boxes instead of a fixed pixel height. */
export function decideNoteCardPreview({
  containerTop,
  lineHeight,
  lineBoxes,
  textlessBoxes,
}: {
  containerTop: number;
  lineHeight: number;
  lineBoxes: NoteCardPreviewBox[];
  textlessBoxes: NoteCardPreviewBox[];
}): NoteCardPreviewDecision {
  const resolvedLineHeight = lineHeight > 0 ? lineHeight : 24;
  const lines = clusterLineBoxes(
    lineBoxes.filter((box) => box.bottom > box.top),
    resolvedLineHeight,
  );

  if (lines.length === 0) {
    return { hasOverflow: false };
  }

  const thirdLineBottom = lines.length >= visibleLineCount
    ? lines[visibleLineCount - 1].bottom
    : lines[lines.length - 1].bottom + (visibleLineCount - lines.length) * resolvedLineHeight;
  const textOverflow = lines.length > visibleLineCount;
  const blockOverflow = textlessBoxes.some((box) => box.bottom > thirdLineBottom + 0.5);

  if (!textOverflow && !blockOverflow) {
    return { hasOverflow: false };
  }

  return {
    hasOverflow: true,
    collapsedMaxHeight: Math.max(0, Math.ceil(thirdLineBottom - containerTop)),
  };
}

/** Reads the container line height used to merge inline fragments onto one visual line. */
export function readNoteCardLineHeight(element: HTMLElement): number {
  const style = getComputedStyle(element);
  const parsedLineHeight = Number.parseFloat(style.lineHeight);

  if (Number.isFinite(parsedLineHeight) && parsedLineHeight > 0) {
    return parsedLineHeight;
  }

  const fontSize = Number.parseFloat(style.fontSize);
  return Number.isFinite(fontSize) && fontSize > 0 ? fontSize * 1.5 : 24;
}

/** Collects one box per rendered text line fragment, including hard breaks. */
export function readNoteCardLineBoxes(root: HTMLElement): NoteCardPreviewBox[] {
  const boxes: NoteCardPreviewBox[] = [];
  const range = root.ownerDocument.createRange();

  if (typeof range.getClientRects !== "function") {
    return boxes;
  }

  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    if (node.textContent) {
      range.selectNodeContents(node);
      appendPreviewBoxes(boxes, range.getClientRects());
    }

    node = walker.nextNode();
  }

  root.querySelectorAll("br").forEach((lineBreak) => {
    if (typeof lineBreak.getClientRects === "function") {
      appendPreviewBoxes(boxes, lineBreak.getClientRects());
    }
  });

  return boxes;
}

/** Collects images, rules, and empty tables. Text tables are counted through their line boxes. */
export function readNoteCardTextlessBoxes(root: HTMLElement): NoteCardPreviewBox[] {
  const boxes: NoteCardPreviewBox[] = [];

  root.querySelectorAll<HTMLElement>("img, hr, svg, video, table").forEach((node) => {
    if (node.closest("table") && node.tagName !== "TABLE") {
      return;
    }

    if (node.tagName === "TABLE" && node.textContent?.trim()) {
      return;
    }

    const rect = node.getBoundingClientRect();
    if (rect.height > 0) {
      boxes.push({ top: rect.top, bottom: rect.bottom });
    }
  });

  return boxes;
}

/** Measures a note preview after removing a collapsed max-height so clipped lines still count. */
export function measureNoteCardPreview(element: HTMLElement): NoteCardPreviewDecision {
  const previousMaxHeight = element.style.maxHeight;
  element.style.maxHeight = "none";

  try {
    return decideNoteCardPreview({
      containerTop: element.getBoundingClientRect().top,
      lineHeight: readNoteCardLineHeight(element),
      lineBoxes: readNoteCardLineBoxes(element),
      textlessBoxes: readNoteCardTextlessBoxes(element),
    });
  } catch (error) {
    console.warn("Failed to measure note card lines", error);
    return { hasOverflow: false };
  } finally {
    element.style.maxHeight = previousMaxHeight;
  }
}

/** Merges fragments whose tops belong to the same rendered line. */
function clusterLineBoxes(boxes: NoteCardPreviewBox[], lineHeight: number): NoteCardPreviewBox[] {
  const threshold = lineHeight / 2;
  const bands: NoteCardPreviewBox[] = [];

  for (const box of [...boxes].sort((left, right) => left.top - right.top || left.bottom - right.bottom)) {
    const band = bands.find((candidate) => Math.abs(box.top - candidate.top) < threshold);

    if (!band) {
      bands.push({ top: box.top, bottom: box.bottom });
      continue;
    }

    band.top = Math.min(band.top, box.top);
    band.bottom = Math.max(band.bottom, box.bottom);
  }

  return bands.sort((left, right) => left.top - right.top);
}

/** Keeps line fragments that produce a visible rectangle. */
function appendPreviewBoxes(boxes: NoteCardPreviewBox[], rects: DOMRectList): void {
  for (const rect of rects) {
    if (rect.height > 0) {
      boxes.push({ top: rect.top, bottom: rect.bottom });
    }
  }
}
