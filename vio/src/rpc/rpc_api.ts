import { CpCall, createWebSocketCpc } from "cpcall";
import type { VioClientExposed, VioServerExposed } from "../vio/api_type.ts";
import { Vio } from "../vio/mod.ts";
import type { WebSocket } from "../lib/deno/http.ts";
import { RpcServerObjectExposed, VioObjectCenterImpl } from "../vio/vio_object/mod.private.ts";
import { RpcServerTtyExposed } from "../vio/tty/mod.private.ts";
import { ClientTtyApi } from "./ClientTtyApi.ts";
import { ClientObjectApi } from "./ClientObjectApi.ts";

export type RpcClientApi = {
  tty: ClientTtyApi;
  object: ClientObjectApi;
};

export function initWebsocket(vio: Vio, ws: WebSocket): { cpc: CpCall; clientApi: RpcClientApi } {
  const cpc = createWebSocketCpc(ws);
  const caller = cpc.genCaller<VioClientExposed>();
  const objectApi = new ClientObjectApi(caller);
  const ttyApi = new ClientTtyApi(caller);
  cpc.setObject({
    object: new RpcServerObjectExposed(vio.object as VioObjectCenterImpl),
    tty: new RpcServerTtyExposed(vio.tty, ttyApi),
  } satisfies VioServerExposed);

  return { clientApi: { object: objectApi, tty: ttyApi }, cpc };
}
