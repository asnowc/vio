import { CpCall, createWebSocketCpc } from "cpcall";
import type {
  VioClientExposed,
  TtyOutputsData,
  VioServerExposed,
  TtyInputsReq,
  ServerTtyExposed,
} from "../vio/api_type.ts";
import { TtyCenter, Vio, TtyReadResolver } from "../vio/mod.ts";
import type { WebSocket } from "../lib/deno/http.ts";
import {
  RpcServerChartExposed,
  RpcServerObjectExposed,
  RpcServerTableExposed,
} from "../vio/vio_object/server_exposed.ts";
import { VioObjectCenterImpl } from "../vio/vio_object/mod.private.ts";
import { ClientTtyApi } from "./ClientTtyApi.ts";
import { ClientObjectApi } from "./ClientObjectApi.ts";

class RpcServerTtyExposed implements ServerTtyExposed {
  constructor(vio: Vio, clientApi: ClientTtyApi) {
    this.#tty = vio.tty;
    this.#clientApi = clientApi;
  }
  #clientApi: ClientTtyApi;
  #tty: TtyCenter;
  getTtyCache(id: number): TtyOutputsData[] {
    const tty = this.#tty.getCreated(id);
    if (!tty) return [];
    return Array.from(tty.getCache());
  }
  resolveTtyReadRequest(ttyId: number, requestId: number, res: any): boolean {
    const hd = this.#resolverMap[ttyId];
    if (!hd) return false;
    return hd.resolve(requestId, res);
  }
  rejectTtyReadRequest(ttyId: number, requestId: number, reason: any): boolean {
    const hd = this.#resolverMap[ttyId];
    if (!hd) return false;
    return hd.reject(requestId, reason);
  }
  inputTty(ttyId: number, data: any): boolean {
    const resolver = this.#resolverMap[ttyId];
    if (!resolver) return false;
    return resolver.input(data);
  }
  /** 某个连接中开启读取权的 tty 字典 */
  #resolverMap: Record<number, TtyReadResolver> = {};
  setTtyReadEnable(ttyId: number, enable: boolean): boolean {
    let resolver = this.#resolverMap[ttyId];
    if (enable) {
      if (resolver) return true;
      else {
        resolver = this.#tty.setReader(ttyId, {
          read: (ttyId: number, requestId: number, data: TtyInputsReq) =>
            this.#clientApi.sendTtyReadRequest(ttyId, requestId, data),
          dispose: () => {
            if (this.#resolverMap[ttyId]) {
              delete this.#resolverMap[ttyId];
              this.#clientApi.ttyReadEnableChange(ttyId, false);
            }
          },
        });
      }
      this.#resolverMap[ttyId] = resolver;
    } else {
      if (resolver) {
        delete this.#resolverMap[ttyId]; // 主动关闭，dispose 之前删除,
        resolver.dispose();
      }
    }
    return true;
  }
}

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
    object: new RpcServerObjectExposed(vio.object),
    chart: new RpcServerChartExposed(vio.object as VioObjectCenterImpl),
    table: new RpcServerTableExposed(vio.object),
    tty: new RpcServerTtyExposed(vio, ttyApi),
  } satisfies VioServerExposed);

  return { clientApi: { object: objectApi, tty: ttyApi }, cpc };
}
