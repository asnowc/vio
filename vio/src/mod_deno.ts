export * from "./mod.ts";
export { default } from "./vio/mod.ts";

import { platformApi } from "./server/platform_api.ts";
platformApi.serve = Deno.serve;
platformApi.upgradeWebSocket = Deno.upgradeWebSocket;
platformApi.responseFile = async function readFileStreamDeno(info): Promise<Response> {
  const fd = await Deno.open(info.filename);
  let headers: Record<string, string> = {
    "content-length": info.size,
  };
  if (info.mime) headers["content-type"] = info.mime;

  return new Response(fd.readable, { status: 200, headers });
};
