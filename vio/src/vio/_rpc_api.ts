import { type CpCall, createWebSocketCpc } from "cpcall";
import type {
  ClientTtyExposed,
  ClientObjectExposed,
  VioClientExposed,
  VioServerExposed,
  TtyInputsReq,
  TtyOutputsData,
} from "./api_type.ts";
import type { WebSocket } from "../lib/deno/http.ts";
import { ClientObjectApi, RpcServerObjectExposed, VioObjectCenterImpl } from "./vio_object/mod.private.ts";
import { ClientTtyApi, RpcServerTtyExposed } from "./tty/mod.private.ts";
import type { Vio } from "./vio.ts";

export type RpcClientApi = {
  tty: ClientTtyExposed;
  object: ClientObjectExposed;
};

export function initWebsocket(vio: Vio, ws: WebSocket): { cpc: CpCall; clientApi: RpcClientApi } {
  const cpc = createWebSocketCpc(ws);
  const caller = cpc.genCaller<VioClientExposed>();
  const objectApi = new ClientObjectApi(caller);
  const ttyApi = new ClientTtyApi(caller);
  cpc.exposeObject({
    object: new RpcServerObjectExposed(vio.object as VioObjectCenterImpl),
    tty: new RpcServerTtyExposed(vio.tty, ttyApi),
  } satisfies VioServerExposed);

  return { clientApi: { object: objectApi, tty: ttyApi }, cpc };
}

export interface Viewer {
  disposed: boolean;
  dispose(): void;
  readTty(ttyId: number, reqId: number, config: TtyInputsReq): void;
  writeTty(ttyId: number, data: TtyOutputsData): void;
}
export class ViewerImpl implements Viewer {
  constructor(
    ttyApi: ClientTtyExposed,
    private onDispose: (viewer: ViewerImpl) => void,
  ) {
    this.#api = ttyApi;
  }
  readTty(ttyId: number, reqId: number, config: TtyInputsReq) {
    this.#api?.sendTtyReadRequest(ttyId, reqId, config);
  }
  writeTty(ttyId: number, data: TtyOutputsData): void {
    this.#api?.writeTty(ttyId, data);
  }
  #api?: ClientTtyExposed;

  dispose(): void {
    if (!this.#api) return;
    this.#api = undefined;
    this.onDispose(this);
  }
  get disposed() {
    return !this.#api;
  }
}
