import type { NuxtConfig } from "nuxt/schema";

export type AppConfig = Pick<NuxtConfig, "app">;
export type ModulesConfig = Pick<
  NuxtConfig,
  "modules" | "googleFonts" | "image" | "dayjs" | "content" | "vitalizer"
>;
export type ViteConfig = Pick<NuxtConfig, "vite">;
export type RuntimeConfigType = Pick<NuxtConfig, "runtimeConfig">;
export type BuildConfig = Pick<NuxtConfig, "nitro" | "css">;
export type DevConfig = Pick<
  NuxtConfig,
  "devServer" | "debug" | "devtools" | "telemetry"
>;
export type HooksConfig = Pick<NuxtConfig, "hooks">;
