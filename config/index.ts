import { appConfig } from "./app";
import { modulesConfig } from "./modules";
import { viteConfig } from "./vite";
import { runtimeConfig } from "./runtime";
import { buildConfig } from "./build";
import { devConfig } from "./dev";
import { hooksConfig } from "./hooks";

export const config = {
  ...appConfig,
  ...modulesConfig,
  ...viteConfig,
  ...runtimeConfig,
  ...buildConfig,
  ...devConfig,
  ...hooksConfig,
};

export {
  appConfig,
  modulesConfig,
  viteConfig,
  runtimeConfig,
  buildConfig,
  devConfig,
  hooksConfig,
};
