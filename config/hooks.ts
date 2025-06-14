import type { HooksConfig } from "./types";

export const hooksConfig: HooksConfig = {
  hooks: {
    "build:manifest": (manifest) => {
      for (const item of Object.values(manifest)) {
        if (item.isEntry && item.css) {
          item.css = item.css.filter((css) => {
            return true;
          });

          item.preload = true;

          if (item.prefetch !== false) {
            item.prefetch = true;
          }
        }

        if (!item.isEntry && item.css) {
          item.preload = true;
        }

        if (item.dynamicImports) {
          item.dynamicImports = item.dynamicImports.filter((imp) => {
            // Keep CSS-related imports
            return imp.includes(".css") || !imp.includes("entry");
          });
        }
      }
    },
  },
};
