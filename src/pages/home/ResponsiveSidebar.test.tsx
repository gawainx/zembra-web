import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { i18next } from "../../i18n";
import { ResponsiveSidebar } from "./ResponsiveSidebar";

afterEach(() => vi.unstubAllGlobals());

async function setup() {
  await i18next.changeLanguage("en-US");
  const media = new EventTarget() as EventTarget & { matches: boolean };
  media.matches = false;
  vi.stubGlobal("matchMedia", () => media);
  render(<ResponsiveSidebar header={<span>Workspace</span>}><button>All notes</button></ResponsiveSidebar>);
  return media;
}

test("opens the sidebar, keeps inside clicks open, and closes from outside with focus restored", async () => {
  await setup();
  fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));
  expect(screen.getByRole("dialog", { name: "Sidebar" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "All notes" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Close sidebar from outside" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Open sidebar" }));
});

test("closes with Escape and the toggle, and clears drawer state on desktop resize", async () => {
  const media = await setup();
  fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));
  fireEvent.click(screen.getByRole("button", { name: "Close sidebar" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));
  act(() => { media.matches = true; media.dispatchEvent(new Event("change")); });
  expect(screen.queryByRole("dialog")).toBeNull();
  act(() => { media.matches = false; media.dispatchEvent(new Event("change")); });
  expect(screen.getByRole("button", { name: "Open sidebar" }).getAttribute("aria-expanded")).toBe("false");
});
