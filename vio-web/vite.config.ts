import type { ProxyOptions, UserConfig, AliasOptions } from "vite";
import { defineProject } from "vitest/config";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

import path from "node:path";
const root = import.meta.dirname;
const HTTPS_ENABLE = false;
const src = path.resolve(root, "src");
const alias: AliasOptions = [
  { find: /^@(?=\/)/, replacement: path.resolve(src) },
  { find: "@asla/vio/client", replacement: path.resolve(root, "../vio/src/client.ts") },
  { find: /^@asla\/vio\//, replacement: path.resolve(root, "../vio/src") + "/" },
];

const config: UserConfig = {
  resolve: {
    alias,
  },
  esbuild: { target: "es2022" },
  build: {
    emptyOutDir: true,
    target: "es2018",
    minify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        minifyInternalExports: true,
        manualChunks: (id, meta) => {
          if (!path.isAbsolute(id)) return;

          const chunksPath = path.resolve(id);
          if (chunksPath.startsWith(src)) return "source";
          if (id.includes("node_modules")) return "deps";
        },
      },
    },
    outDir: "../vio/assets/web",
  },
  plugins: [
    react(),
    legacy({
      renderLegacyChunks: false,
      polyfills: false,

      renderModernChunks: true,
      modernPolyfills: true,
      modernTargets: "defaults",
    }),
  ],
  optimizeDeps: {
    exclude: ["@asla/vio"],
  },
  server: {
    proxy: genProxies("http://127.0.0.1:8887"),
    https: HTTPS_ENABLE
      ? {
          key: "./localhost.key",
          cert: "./localhost.crt",
        }
      : undefined,
  },
};

function genProxies(origin: string): Record<string, string | ProxyOptions> {
  return {
    "/api": { target: origin, ws: true },
  };
}

export default {
  ...config,
  ...defineProject({
    test: {},
  }),
};
