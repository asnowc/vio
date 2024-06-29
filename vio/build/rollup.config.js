//@ts-check

import { defineEvConfig } from "@eavid/lib-dev/rollup";
import path from "node:path";
import fs from "node:fs/promises";
export const dev = !Boolean(process.env.PROD);
if (dev) {
  console.log("Rollup in DEV");
}
//@ts-ignore
export const rootDir = path.resolve(import.meta.dirname, "..");

export const baseInput = {
  mod_node: "./src/mod_node.ts",
  serve: "./src/lib/serve.ts",
  websocket: "./src/lib/websocket.ts",
};
const inputs = Object.entries(baseInput).map(([k, v]) => [k, path.resolve(rootDir, v)]);

export default defineEvConfig({
  input: Object.fromEntries(inputs),
  output: {
    dir: path.resolve(rootDir, "dist"),
    sourcemap: dev,
    sourcemapExcludeSources: true,
    chunkFileNames: "[name].js",
    minifyInternalExports: false,
  },
  treeshake: {
    moduleSideEffects: false,
  },
  plugins: [
    {
      name: "move types",
      async generateBundle() {
        await fs.rm(path.resolve(rootDir, "dist"), { force: true, recursive: true });
      },
      async writeBundle() {
        const typeDir = rootDir + "/temp";
        await fs.rm(path.resolve(typeDir), { force: true, recursive: true });
        await fs.rename(path.resolve(rootDir, "dist/types"), typeDir);
      },
    },
  ],
  extra: {
    typescript: {
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        declaration: true,
        declarationDir: "dist/types",
        declarationMap: dev,
      },
      include: ["src/**", "lib/**"],
    },
    resolve: { resolveOnly: ["evlib", "@eavid/lib-node"] },
  },
});
