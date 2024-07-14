import path from "node:path";

export class InstanceDisposedError extends Error {
  constructor(name: string = "Instance") {
    super(`${name} has been disposed`);
  }
}

// 输出目录保持

export const packageDir = (function () {
  const dirname = import.meta.dirname;
  //在 jsr 包 上不存在
  return dirname ? path.resolve(dirname, "..") : undefined;
})();
