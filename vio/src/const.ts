import path from "node:path";

export class InstanceDisposedError extends Error {
  constructor(name: string = "Instance") {
    super(`${name} has been disposed`);
  }
}
// 输出目录保持
export const packageDir = path.resolve(import.meta.dirname, "..");
export const runtime = (function () {
  try {
    return "deno";
  } catch (error) {
    return "node";
  }
})();
