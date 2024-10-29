import { VioClientExposed, VioServerExposed } from "@asla/vio/client";
import { CpCall, MakeCallers, createWebSocketCpc } from "cpcall";
import { connectWebsocket, WsConnectConfig } from "../lib/websocket.ts";
import React, { createContext } from "react";
import { TtyViewService } from "./vio_api/TtyViewService.ts";
import { LogService } from "./vio_api/LogService.ts";
import { EventTrigger } from "evlib";
import { ClientVioObjectService } from "./vio_api/ClientVioObjectService.ts";
export * from "./vio_api/ClientVioObjectService.ts";
export * from "./vio_api/TtyViewService.ts";
export * from "./vio_api/LogService.ts";
export type { WsConnectConfig };

export enum RpcConnectStatus {
  disconnected = 0,
  connecting = 1,
  connected = 2,
}

export class VioRpcApi {
  constructor() {}
  get connected() {
    return this.status === RpcConnectStatus.connected;
  }
  /** 0: 已断开。1：连接中。2: 已连接 */
  status: RpcConnectStatus = RpcConnectStatus.disconnected;
  readonly statusChange = new EventTrigger<RpcConnectStatus>();
  async connect(config: string | WsConnectConfig) {
    if (this.status !== RpcConnectStatus.disconnected) throw new Error("当前状态不允许连接");
    this.status = RpcConnectStatus.connecting;
    this.statusChange.emit(RpcConnectStatus.connecting);
    try {
      const ws = await connectWebsocket(config);
      const cpc = createWebSocketCpc(ws);
      this.onCpcConnect(cpc);
      this.status = RpcConnectStatus.connected;
    } catch (e) {
      this.status = RpcConnectStatus.disconnected;
      throw e;
    } finally {
      this.statusChange.emit(this.status);
    }
  }
  mockConnect() {
    this.status = RpcConnectStatus.connected;
    return this.#clientRoot;
  }
  disconnect() {
    this.#cpc?.dispose();
    this.#cpc = null;
  }
  readonly chart = new ClientVioObjectService();
  readonly tty = new TtyViewService();
  #clientRoot: VioClientExposed = {
    object: this.chart,
    tty: this.tty,
  };

  readonly log = new LogService();

  #cpc?: CpCall | null;
  #serverApi?: MakeCallers<VioServerExposed>;
  async loadTtyCache(id: number) {
    if (!this.#serverApi) return [];
    return this.#serverApi.tty.getTtyCache(id);
  }
  private onCpcConnect(cpc: CpCall) {
    this.chart.clearObject();
    this.#cpc = cpc;
    cpc.exposeObject(this.#clientRoot);
    this.#serverApi = cpc.genCaller<VioServerExposed>();
    this.tty.init(this.#serverApi.tty);
    this.chart.init(this.#serverApi.object);
    cpc.onClose
      .finally(() => {
        this.status = RpcConnectStatus.disconnected;
        this.#cpc = null;
        this.#serverApi = undefined;
        this.tty.init();
        this.chart.init();
        this.statusChange.emit(this.status);
      })
      .catch(() => {});
  }
}
//@ts-ignore
const vioState = createContext<VioRpcApi>();

export const VioStateProvider = vioState.Provider;
export function useVioApi() {
  return React.useContext(vioState);
}
