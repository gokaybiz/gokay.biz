import type { ModulesConfig } from "./types";

export const modulesConfig: ModulesConfig = {
  modules: [
    "@nuxt/content",
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxtjs/google-fonts",
    "@nuxt/scripts",
    "dayjs-nuxt",
  ],
  googleFonts: {
    download: true,
    families: {
      "Short Stack": [400],
      Caveat: [400, 700],
      "Dancing Script": [400, 700],
      Inter: "100..900",
    },
    display: "swap",
  },
  image: {
    provider: "none",
  },
  dayjs: {
    locales: ["en"],
    plugins: ["timezone", "utc"],
  },
  content: {
    build: {
      markdown: {
        highlight: {
          theme: "dracula-soft",
        },
        toc: {
          depth: 5,
          searchDepth: 5,
        },
      },
    },
    renderer: {
      anchorLinks: true,
      alias: {
        a: "UtilLink",
        // img: "UtilImg", // <- Causing bug in content rendering (id mismatch with heading tags)
      },
    },
  },
};
