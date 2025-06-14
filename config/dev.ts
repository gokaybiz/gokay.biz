import type { DevConfig } from "./types";

export const devConfig: DevConfig = {
  devServer: {
    host: "0.0.0.0",
  },
  debug: true,
  devtools: { enabled: false },
  telemetry: false,
};
