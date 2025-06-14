import type { DevConfig } from "./types";

export const devConfig: DevConfig = {
  devServer: {
    host: "0.0.0.0",
  },
  debug: process.env.NODE_ENV === "development",
  devtools: { enabled: false },
  telemetry: false,
};
