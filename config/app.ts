import type { AppConfig } from "./types";

export const appConfig: AppConfig = {
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
          src: "https://kontroll.gokay.biz/flare.min.js",
          "data-cf-beacon": `{"token": "${process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN}"}`,
        },
      ],
    },
    pageTransition: {
      name: "fade",
      mode: "out-in",
    },
  },
};
