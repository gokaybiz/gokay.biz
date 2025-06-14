import { defineNuxtConfig } from "nuxt/config";
import tailwindcss from "@tailwindcss/vite";
import svgLoader from "vite-svg-loader";
import { resolve } from "node:path";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  experimental: {
    watcher: "parcel",
    defaults: {
      nuxtLink: {
        trailingSlash: "remove",
      },
    },
  },
  devServer: {
    host: "0.0.0.0",
  },
  compatibilityDate: "2025-06-02",
  telemetry: false,
  debug: true,
  devtools: { enabled: false },
  modules: [
    "@nuxt/content",
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxtjs/google-fonts",
    "@nuxt/scripts",
    "dayjs-nuxt",
  ],
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        { name: "format-detection", content: "telephone=no" },
        { name: "msapplication-TileColor", content: "#da532c" },
        { name: "theme-color", content: "#ffffff" },
        {
          name: "google-site-verification",
          content: process.env.GOOGLE_SITE_VERIFICATION || "",
        },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "96x96",
          href: "/favicon-96x96.png",
        },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
      script: [
        {
          textContent:
            "(function(){if(localStorage.getItem('themeStyle')==='dark'){document.documentElement.classList.add('dark')}})()",
          tagPosition: "head",
          type: "text/javascript",
        },
        {
          defer: true,
          src: "https://kontroll.gokay.biz/beacon.min.js",
          "data-cf-beacon": '{"token": "265e34b9577b497f8326239f9272c97d"}',
        },
      ],
    },
    pageTransition: {
      name: "fade",
      mode: "out-in",
    },
  },
  css: ["~/assets/css/main.css"],
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
  // mdc: {
  //   highlight: {
  //     shikiEngine: "javascript",
  //   },
  //   keepComments: false,
  // },
  vite: {
    logLevel: "info",
    plugins: [tailwindcss(), svgLoader()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./"),
        "@@": resolve(__dirname, "./"),
        "~": resolve(__dirname, "./app"),
      },
    },
    build: {
      sourcemap: process.env.NODE_ENV === "development",
    },
    optimizeDeps: {
      include: ["vue", "vue-router"],
    },
  },
  runtimeConfig: {
    // Server-side only private config
    lastfmApiKey: "",
    googleSiteVerification: "",

    // Config that is also exposed to the client side
    public: {
      timezone: "",
      lastfmUser: "",
      vscoUser: "",
      siteUrl: "https://gokay.biz",
      siteName: "Gökay Biz",
    },
  },
  nitro: {
    preset: "netlify",
    prerender: {
      routes: ["/sitemap.xml", "/robots.txt"],
    },
  },
});
