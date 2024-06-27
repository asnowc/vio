import fs from "node:fs/promises";
import path from "node:path";
import { runtime } from "../const.ts";
import type { ReadableStream } from "node:stream/web";

type MaybePromise<T> = T extends Promise<any> ? T | Awaited<T> : T | Promise<T>;
export class FileServerHandler {
  constructor(readonly rootDir: string) {
    this.#mime = { ...MIME };
  }
  #cache = new Map<string, MaybePromise<FileStatusCache | undefined>>();
  async getResponse(pathname: string): Promise<Response | undefined> {
    const info = await this.getFileInfo(pathname);
    if (!info) return;
    return this.#responseFile(info);
  }
  private async getFileInfo(pathname: string) {
    if (pathname === "/") pathname = "/index.html";

    let info = this.#cache.get(pathname);
    if (info === undefined) {
      const resolver = Promise.withResolvers<FileStatusCache | undefined>();
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
  async #responseFile(info: FileStatusCache) {
    const filename = info.filename;
    const stream = await readFileStream(filename);

    let headers: Record<string, string> = {
      "content-length": info.size,
    };
    if (info.mime) headers["content-type"] = info.mime;

    return new Response(stream, { status: 200, headers: headers });
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
function readFileStreamNode(pathname: string): Promise<ReadableStream<Uint8Array>> {
  return fs.open(pathname).then((fd) => fd.readableWebStream());
}
function readFileStreamDeno(pathname: string): Promise<ReadableStream<Uint8Array>> {
  //@ts-ignore
  return Deno.open(pathname).then((fd) => fd.readable);
}
const readFileStream = runtime === "deno" ? readFileStreamDeno : readFileStreamNode;
