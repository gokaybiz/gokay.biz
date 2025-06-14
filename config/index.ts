import { appConfig } from "./app";
import { modulesConfig } from "./modules";
import { viteConfig } from "./vite";
import { runtimeConfig } from "./runtime";
import { buildConfig } from "./build";
import { devConfig } from "./dev";

export const config = {
  ...appConfig,
  ...modulesConfig,
  ...viteConfig,
  ...runtimeConfig,
  ...buildConfig,
  ...devConfig,
};

export {
  appConfig,
  modulesConfig,
  viteConfig,
  runtimeConfig,
  buildConfig,
  devConfig,
};
