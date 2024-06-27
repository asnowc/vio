import type { ProxyOptions, UserConfig } from "vite";
import path from "node:path";
const dir = import.meta.dirname;

const src = path.resolve(dir, "src");

const config: UserConfig = {
  resolve: {
    alias: [{ find: /^@(?=\/)/, replacement: path.resolve(src) }],
  },
  build: {
    target: "es2017",
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

  optimizeDeps: {
    exclude: ["@asnc/vio"],
  },
  server: {
    proxy: genProxies("http://127.0.0.1:8887"),
  },
};

function genProxies(origin: string): Record<string, string | ProxyOptions> {
  return {
    "/api": { target: origin, ws: true },
  };
}

export default config;
