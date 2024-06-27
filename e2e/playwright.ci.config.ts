import { defineConfig, PlaywrightTestConfig } from "@playwright/test";

export const webServerInfo = {
  hostname: "127.0.0.1",
  port: 4173,
};

export default defineConfig({
  testDir: ".",
  webServer: createWebServerConfig(webServerInfo.hostname, webServerInfo.port),
  use: {
    channel: "msedge",
    browserName: "chromium",
  },
  outputDir: "temp",
});

export function createWebServerConfig(hostname: string, port: number): PlaywrightTestConfig["webServer"] {
  return {
    cwd: "../packages/vio-web",
    command: `pnpm vite --host ${hostname} --port ${port} --mode production`,
    url: `http://${hostname}:${port}`,
    stdout: "pipe",
    stderr: "pipe",
  };
}
