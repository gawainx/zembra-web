import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/** Creates the Vite configuration for the Zembra web UI. */
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
});
