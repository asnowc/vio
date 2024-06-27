//@ts-check

import { defineEvConfig } from "@eavid/lib-dev/rollup";
import { dts } from "rollup-plugin-dts";
import config, { baseInput, rootDir, dev } from "./rollup.config.js";
import path from "node:path";
import fs from "node:fs/promises";
const inputs = Object.entries(baseInput)
  .map(([k, v]) => [k, v.replace("src", "temp").replace(/.ts$/, ".d.ts")])
  .map(([k, v]) => [k, path.resolve(rootDir, v)]);

export default defineEvConfig({
  input: Object.fromEntries(inputs),
  output: {
    dir: path.resolve(rootDir, "dist"),
    sourcemap: dev,
    sourcemapExcludeSources: true,
    minifyInternalExports: false,
  },
  treeshake: config.treeshake,
  plugins: [
    dts({
      respectExternal: true,
      compilerOptions: {
        rootDir: path.resolve(rootDir, "./dist/types"),
      },
    }),
  ],
  extra: {
    resolve: { resolveOnly: ["evlib", "@eavid/lib-node"] },
  },
});
