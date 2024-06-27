import { defineConfig } from "vitest/config";
import path from "node:path";

const dir = import.meta.dirname;
export default defineConfig({
  esbuild: {
    target: "ES2022",
  },
  test: {
    alias: { "@asnc/vio": path.resolve(dir, "vio/src/mod.ts") },
    coverage: {
      include: ["./vio*/src"],
      exclude: ["./vio*/src/lib"],
    },
    exclude: ["node_modules", "./e2e", "dist", "temp"],
  },
});
