import path from "node:path";
import process from "node:process";

export class InstanceDisposedError extends Error {
  constructor(name: string = "Instance") {
    super(`${name} has been disposed`);
  }
}

// 输出目录保持

export const packageDir = (function () {
  const dirname = import.meta.dirname;
  return dirname ? path.resolve(dirname, "..") : process.cwd();
})();
