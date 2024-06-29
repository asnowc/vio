export * from "./mod.ts";
export { default } from "./vio/mod.ts";

import { platformApi } from "./server/platform_api.ts";
import { serve, upgradeWebSocket } from "./lib/serve.ts";
import { TransformStream, ReadableStream } from "node:stream/web";
import fs from "node:fs/promises";

platformApi.serve = serve;
platformApi.upgradeWebSocket = upgradeWebSocket;
platformApi.responseFile = async function (info): Promise<Response> {
  const filename = info.filename;
  const fd = await readFileStreamNode(filename);

  let headers: Record<string, string> = {
    "content-length": info.size,
  };
  if (info.mime) headers["content-type"] = info.mime;

  return new Response(fd.readable, { status: 200, headers: headers });
};

function readFileStreamNode(pathname: string): Promise<FileStreamHandle> {
  return fs.open(pathname).then((fd) => {
    const trans = new TransformStream<any, Uint8Array>({
      transform(chunk, controller) {
        if (chunk instanceof ArrayBuffer) {
          const data = new Uint8Array(chunk, 0, chunk.byteLength);
          controller.enqueue(data);
        } else if (chunk instanceof Uint8Array) controller.enqueue(chunk);
        else controller.error(new Error("不支持的数据: " + String(chunk)));
      },
    });
    return { readable: fd.readableWebStream({ type: "bytes" }).pipeThrough(trans), close: () => fd.close() };
  });
}
interface FileStreamHandle {
  readable: ReadableStream<Uint8Array>;
  close(): Promise<void>;
}
