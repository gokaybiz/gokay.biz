import { defineNuxtConfig } from "nuxt/config";
import { config } from "./config";

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

  // Merge modular options with the main config
  ...config,
});
