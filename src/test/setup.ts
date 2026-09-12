import { vi } from "vitest";
import "../i18n";

/** Provides browser APIs that are not implemented by jsdom. */
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

// Radix observes control sizes; jsdom has no layout or ResizeObserver implementation.
class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, "ResizeObserver", { value: TestResizeObserver, writable: true });
