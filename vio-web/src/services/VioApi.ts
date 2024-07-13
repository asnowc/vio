import {
  ChartCreateInfo,
  ChartUpdateData,
  TtyInputsReq,
  TtyOutputsData,
  VioClientExposed,
  VioServerExposed,
} from "@asla/vio/client";
import { CpCall, MakeCallers, createWebSocketCpc } from "cpcall";
import { connectWebsocket, WsConnectConfig } from "../lib/websocket.ts";
import React, { createContext } from "react";
import { TtyViewService } from "./vio_api/TtyViewService.ts";
import { ChartsDataCenterService } from "./vio_api/ChartsDataCenterService.ts";
import { LogService } from "./vio_api/LogService.ts";
import { EventTrigger } from "evlib";
export * from "./vio_api/TtyViewService.ts";
export * from "./vio_api/ChartsDataCenterService.ts";
export * from "./vio_api/LogService.ts";
export type { WsConnectConfig };
type MaybePromise<T> = T | Promise<T>;

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
  #clientRoot: VioClientExposed = {
    createChart: (chartInfo: ChartCreateInfo): void => {
      this.chart.createChart(chartInfo);
      this.log.pushLog("chart", chartInfo, "create");
    },
    deleteChart: (chartId: number): void => {
      this.chart.deleteChart(chartId);
      this.log.pushLog("chart", chartId, "delete");
    },
    writeChart: (chartId: number, data: Readonly<ChartUpdateData<any>>): void => {
      this.chart.writeChart(chartId, data);
      this.log.pushLog("chart", data, "update");
    },
    sendTtyReadRequest: (id: number, requestId: number, opts: TtyInputsReq): MaybePromise<any> => {
      this.log.pushLog("tty", { id, data: opts }, "input");
      return this.tty.get(id, true).addReading(requestId, opts);
    },

    writeTty: (id: number, data: TtyOutputsData): void => {
      this.tty.get(id, true).addOutput(data);
      this.log.pushLog("tty", { id, data }, "output");
    },
    ttyReadEnableChange: (ttyId, enable) => {
      const tty = this.tty.get(ttyId, true);
      tty.setReadEnable(enable, { passive: true });
    },
  };
  // readonly tty = new TtyViewService(); // 纯输出
  readonly chart = new ChartsDataCenterService(); // 纯输出
  readonly tty = new TtyViewService();

  readonly log = new LogService();

  #cpc?: CpCall | null;
  #serverApi?: MakeCallers<VioServerExposed>;
  async loadTtyCache(id: number) {
    if (!this.#serverApi) return [];
    return this.#serverApi.getTtyCache(id);
  }
  private onCpcConnect(cpc: CpCall) {
    this.chart.clearChart();
    this.#cpc = cpc;
    cpc.setObject(this.#clientRoot satisfies VioClientExposed);
    this.#serverApi = cpc.genCaller<VioServerExposed>();
    this.#serverApi.getCharts().then(({ list }) => {
      this.chart.setCache(list);
    });
    this.tty.init(this.#serverApi!);
    this.chart.init(this.#serverApi);
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
