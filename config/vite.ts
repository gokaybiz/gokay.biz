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
          experimentalMinChunkSize: 20 * 1024, // 20kb for chunking
        },
      },
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info"],
          unsafe_comps: true,
          unsafe_Function: true,
          unsafe_math: true,
          unsafe_symbols: true,
          unsafe_methods: true,
          unsafe_proto: true,
          unsafe_regexp: true,
          unsafe_undefined: true,
        },
        format: {
          comments: false,
        },
        mangle: {
          safari10: true,
        },
      },
      cssMinify: "lightningcss",
      cssCodeSplit: true,
      modulePreload: {
        polyfill: true,
      },
      assetsInlineLimit: 8192, // 8kb inline limit
    },
    optimizeDeps: {
      include: ["vue", "vue-router", "@unhead/vue", "dayjs"],
      exclude: ["@nuxt/telemetry", "@nuxt/devtools"],
      esbuildOptions: {
        define: {
          global: "globalThis",
        },
        supported: {
          bigint: true,
        },
      },
    },
    esbuild: {
      drop:
        process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    },
  },
};
