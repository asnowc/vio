export * from "./mod.ts";
export { default } from "./vio/mod.ts";

import { checkResponse304 } from "./lib/http_server/file_cache_reponse.ts";
import { platformApi, ResponseFileHandler } from "./server/platform_api.ts";

class DenoResponseFile implements ResponseFileHandler {
  async getResponse(
    filename: string,
    reqHeaders: Headers,
    resHeaders: Record<string, string>,
  ): Promise<Response | null> {
    const fd = await Deno.open(filename).catch(() => null);
    if (!fd) return null;
    const stat = await fd.stat().then((stat) => {
      if (!stat.isFile) return;
      return stat;
    });
    if (!stat) {
      fd.close();
      return null;
    }
    resHeaders = { ...resHeaders };
    if (!this.noCache && stat.mtime) {
      const resp = checkResponse304({ mtime: stat.mtime }, reqHeaders, resHeaders);
      if (resp) return resp;
      resHeaders["Last-Modified"] = stat.mtime.toUTCString();
    }
    resHeaders["content-length"] = stat.size.toString();
    return new Response(fd.readable, { status: 200, headers: resHeaders });
  }
  noCache = false;
}

platformApi.serve = Deno.serve;
platformApi.upgradeWebSocket = Deno.upgradeWebSocket;
platformApi.responseFileHandler = new DenoResponseFile();
