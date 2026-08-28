import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

/** Creates the Vite configuration for the Zembra web UI. */
export default defineConfig(({ command, mode }) => {
  const dataSourceTarget = mode === "backend" || mode === "supabase"
    ? mode
    : mode === "test"
      ? "backend"
      : undefined;

  if (!dataSourceTarget) {
    throw new Error(
      "Choose a data-source build target with --mode backend or --mode supabase.",
    );
  }

  return {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@zembra/data-source-runtime": resolve(
        __dirname,
        `src/api/runtime/${dataSourceTarget}.ts`,
      ),
      "@zembra/source-entry": resolve(
        __dirname,
        `src/app/source-entry/${dataSourceTarget}.tsx`,
      ),
      "@zembra/source-home-controls": resolve(
        __dirname,
        `src/pages/home/source-home-controls/${dataSourceTarget}.tsx`,
      ),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /** Groups third-party code by loading boundary for independent caching. */
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("/node_modules/@tiptap/")) {
            return "tiptap";
          }

          if (id.includes("/node_modules/prosemirror-")) {
            return "prosemirror";
          }

          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/scheduler/")
          ) {
            return "react";
          }

          if (id.includes("/node_modules/@tanstack/")) {
            return "router";
          }

          if (
            id.includes("/node_modules/i18next/") ||
            id.includes("/node_modules/react-i18next/")
          ) {
            return "i18n";
          }

          if (id.includes("/node_modules/@supabase/")) {
            return "supabase";
          }

          if (id.includes("/node_modules/lucide-react/")) {
            return "icons";
          }

          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  };
});
