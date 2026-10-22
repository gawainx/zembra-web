import { expect, test } from "vitest";
import { decideNoteCardPreview, type NoteCardPreviewBox } from "./noteCardPreview";

const lineHeight = 24;

/** Builds one rendered line box from its top edge. */
function line(top: number, height = lineHeight): NoteCardPreviewBox {
  return { top, bottom: top + height };
}

test("keeps three spaced text lines fully visible", () => {
  expect(decideNoteCardPreview({
    containerTop: 0,
    lineHeight,
    lineBoxes: [line(0), line(32), line(64)],
    textlessBoxes: [],
  })).toEqual({ hasOverflow: false });
});

test("clips at the third wrapped line when a fourth line exists", () => {
  expect(decideNoteCardPreview({
    containerTop: 10,
    lineHeight,
    lineBoxes: [line(10), line(34), line(58), line(82)],
    textlessBoxes: [],
  })).toEqual({ hasOverflow: true, collapsedMaxHeight: 72 });
});

test("counts inline chips that share a line as one line", () => {
  expect(decideNoteCardPreview({
    containerTop: 0,
    lineHeight,
    lineBoxes: [line(0), { top: 2, bottom: 22 }, line(24), line(48)],
    textlessBoxes: [],
  })).toEqual({ hasOverflow: false });
});

test("collapses a textless block that extends past the third line", () => {
  expect(decideNoteCardPreview({
    containerTop: 0,
    lineHeight,
    lineBoxes: [line(0), line(32)],
    textlessBoxes: [{ top: 64, bottom: 240 }],
  })).toEqual({ hasOverflow: true, collapsedMaxHeight: 80 });
});

test("keeps a short rule within the three-line budget visible", () => {
  expect(decideNoteCardPreview({
    containerTop: 0,
    lineHeight,
    lineBoxes: [line(0), line(32)],
    textlessBoxes: [{ top: 60, bottom: 61 }],
  })).toEqual({ hasOverflow: false });
});

test("collapses a rule that sits below the third text line", () => {
  expect(decideNoteCardPreview({
    containerTop: 0,
    lineHeight,
    lineBoxes: [line(0), line(32), line(64)],
    textlessBoxes: [{ top: 96, bottom: 97 }],
  })).toEqual({ hasOverflow: true, collapsedMaxHeight: 88 });
});

test("keeps a note that is only an image fully visible", () => {
  expect(decideNoteCardPreview({
    containerTop: 0,
    lineHeight,
    lineBoxes: [],
    textlessBoxes: [{ top: 0, bottom: 400 }],
  })).toEqual({ hasOverflow: false });
});
