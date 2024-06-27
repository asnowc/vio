import { defineConfig } from "@playwright/test";
import { webServerInfo } from "./playwright.ci.config.ts";

webServerInfo.hostname = "localhost";
webServerInfo.port = 5173;

export default defineConfig({
  testDir: ".",
  use: {
    channel: "msedge",
    browserName: "chromium",
  },
  outputDir: "temp",
});
