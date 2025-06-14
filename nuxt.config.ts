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
      },
    },
  },
  compatibilityDate: "2025-06-02",
  // Merge modular options with the main config
  ...config,
});
