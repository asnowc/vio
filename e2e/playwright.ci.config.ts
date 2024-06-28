import { defineConfig } from "@playwright/test";

export const env: { webServerInfo?: { hostname: string; port: number } } = {};

export default defineConfig({
  reporter: "html",
  testDir: ".",
  use: {
    browserName: "chromium",
  },
  outputDir: "temp",
  timeout: 10000,
});
