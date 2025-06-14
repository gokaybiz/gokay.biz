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
      rollupOptions: {
        output: {
          experimentalMinChunkSize: 46 * 1024, // 46kb
        },
      },
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info"],
        },
        format: {
          comments: false,
        },
        mangle: {
          safari10: true,
        },
      },
      cssMinify: true,
      cssCodeSplit: true,
      modulePreload: {
        polyfill: true,
      },
    },
    optimizeDeps: {
      include: ["vue", "vue-router"],
      exclude: ["@nuxt/telemetry"],
    },
  },
};
