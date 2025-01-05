import path from "node:path";
import { platformApi } from "./platform_api.ts";

export class FileServerHandler {
  constructor(
    readonly rootDir: string,
    option: FileServerOption = {},
  ) {
    this.#mime = { ...MIME };
    const { setHeaders } = option;
    this.#serHEaders = setHeaders ? { ...setHeaders } : {};
  }
  async getResponse(pathname: string, reqHeaders: Headers): Promise<Response | undefined> {
    if (pathname === "/") pathname = "/index.html";
    const filename = this.rootDir + pathname;
    const response = await platformApi.responseFileHandler.getResponse(filename, reqHeaders, this.#serHEaders);
    if (!response) return;
    if (pathname === "/index.html") response.headers.set("cache-control", "no-store");
    const { ext } = path.parse(pathname);
    const mime = this.#mime[ext];
    if (mime) {
      response.headers.set("content-type", mime);
    }
    return response;
  }
  #serHEaders: Record<string, string>;
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
export interface FileServerOption {
  setHeaders?: Record<string, string>;
}
