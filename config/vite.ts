import type { ViteConfig } from "./types";
import tailwindcss from "@tailwindcss/vite";
import svgLoader from "vite-svg-loader";
import { resolve } from "node:path";

export const viteConfig: ViteConfig = {
  vite: {
    logLevel: "info",
    plugins: [tailwindcss(), svgLoader()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "../"),
        "@@": resolve(__dirname, "../"),
        "~": resolve(__dirname, "../app"),
      },
    },
    build: {
      sourcemap: process.env.NODE_ENV === "development",
    },
    optimizeDeps: {
      include: ["vue", "vue-router"],
    },
  },
};
