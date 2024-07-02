export * from "./mod.ts";
export { default } from "./vio/mod.ts";

import { platformApi, ResponseFileHandler } from "./server/platform_api.ts";
import { serve, upgradeWebSocket } from "./lib/serve.ts";
import { TransformStream } from "node:stream/web";
import fs from "node:fs/promises";
import { checkResponse304 } from "./lib/http_server/file_cache_reponse.ts";
class NodeResponseFile implements ResponseFileHandler {
  async getResponse(
    filename: string,
    reqHeaders: Headers,
    resHeaders: Record<string, string>,
  ): Promise<Response | null> {
    const fd = await fs.open(filename).catch(() => null);
    if (!fd) return null;
    const stat = await fd.stat().then((stat) => {
      if (stat.isFile()) {
        return { size: stat.size, mtime: stat.mtime };
      }
      return;
    });
    if (!stat) {
      fd.close();
      return null;
    }
    resHeaders = { ...resHeaders };
    if (!this.noCache) {
      const resp = checkResponse304(stat, reqHeaders, resHeaders);
      if (resp) return resp;
      resHeaders["Last-Modified"] = stat.mtime.toUTCString();
    }
    resHeaders["content-length"] = stat.size.toString();

    const trans = new TransformStream<any, Uint8Array>({
      flush() {
        return fd.close();
      },
      transform(chunk, controller) {
        if (chunk instanceof ArrayBuffer) {
          const data = new Uint8Array(chunk, 0, chunk.byteLength);
          controller.enqueue(data);
        } else if (chunk instanceof Uint8Array) controller.enqueue(chunk);
        else controller.error(new Error("不支持的数据: " + String(chunk)));
      },
    });
    const readable = fd.readableWebStream({ type: "bytes" }).pipeThrough(trans);
    return new Response(readable, { status: 200, headers: resHeaders });
  }
  noCache = false;
}

platformApi.serve = serve;
platformApi.upgradeWebSocket = upgradeWebSocket;
platformApi.responseFileHandler = new NodeResponseFile();
