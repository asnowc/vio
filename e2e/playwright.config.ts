import { defineConfig } from "@playwright/test";
import { env } from "./playwright.ci.config.ts";

env.webServerInfo = {
  hostname: "localhost",
  port: 5173,
};

export default defineConfig({
  testDir: ".",
  use: {
    channel: "msedge",
    browserName: "chromium",
  },
  outputDir: "temp",
  timeout: 10000,
});
