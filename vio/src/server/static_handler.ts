import fs from "node:fs/promises";
import path from "node:path";
import { withPromise } from "evlib";
import { platformApi } from "./platform_api.ts";

type MaybePromise<T> = T extends Promise<any> ? T | Awaited<T> : T | Promise<T>;
export class FileServerHandler {
  constructor(readonly rootDir: string) {
    this.#mime = { ...MIME };
  }
  #cache = new Map<string, MaybePromise<FileStatusCache | undefined>>();
  async getResponse(pathname: string): Promise<Response | undefined> {
    const info = await this.getFileInfo(pathname);
    if (!info) return;
    return platformApi.responseFile(info);
  }
  private async getFileInfo(pathname: string) {
    if (pathname === "/") pathname = "/index.html";

    let info = this.#cache.get(pathname);
    if (info === undefined) {
      const resolver = withPromise<FileStatusCache | undefined>();
      this.#cache.set(pathname, resolver.promise as any);

      const baseDir = this.rootDir + pathname;

      let checkPath = baseDir;

      info = await fs.stat(checkPath).then(
        (stat) => {
          if (!stat.isFile()) return;
          const { ext } = path.parse(checkPath);
          return { size: stat.size.toString(), mime: this.#mime[ext], filename: checkPath };
        },
        () => undefined,
      );
      if (info) {
        this.#cache.set(pathname, info);
        resolver.resolve(info);
        return info;
      } else {
        this.#cache.delete(pathname);
        resolver.resolve(undefined);
        return undefined;
      }
    }
    return info;
  }

  #mime: Record<string, string> = {};
}

const MIME = (function (): Record<string, string> {
  const define = {
    "application/javascript": [".js", ".mjs", ".cjs"],
    "application/json": [".json"],
    "text/html": [".html"],
  };
  return Object.entries(define).reduce<Record<string, string>>((map, [mime, extList]) => {
    for (const ext of extList) {
      map[ext] = mime;
    }
    return map;
  }, {});
})();
interface FileStatusCache {
  size: string;
  mime?: string;
  filename: string;
}
