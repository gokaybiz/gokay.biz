import { defineNuxtConfig } from "nuxt/config";
import { config } from "./config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  experimental: {
    watcher: "parcel",
    asyncContext: true,
    asyncEntry: true,
    defaults: {
      nuxtLink: {
        trailingSlash: "remove",
        prefetchOn: { visibility: true, interaction: true },
      },
    },
  },
  router: {
    options: {
      scrollBehaviorType: "smooth",
    },
  },
  features: {
    inlineStyles: false,
    noScripts: false,
  },
  compatibilityDate: "2025-06-02",
  // Merge modular options with the main config
  ...config,
});
