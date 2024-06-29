import { CpCall, MakeCallers } from "cpcall";
import type {
  VioClientExposed,
  ChartInfo,
  TtyOutputsData,
  VioServerExposed,
  ChartCreateInfo,
  ChartUpdateData,
  TtyInputsReq,
} from "../vio/api_type.ts";
import { TtyCenter, ChartCenter, Vio } from "../vio/mod.ts";
import { RequestUpdateRes, TtyReadResolver, VioChart } from "../vio/classes/mod.ts";
import { WebSocket } from "../lib/http_server/mod.ts";
import { createWebSocketCpc } from "cpcall/web";
import { MaybePromise } from "../type.ts";
import { indexRecordToArray } from "../lib/array_like.ts";
function getChartInfo<T>(chart: VioChart<T>): ChartInfo<T> {
  return {
    meta: chart.meta,
    dimension: chart.dimension,
    id: chart.id,
    cacheData: Array.from(chart.getCacheData()),
    dimensionIndexNames: indexRecordToArray(chart.dimensionIndexNames, chart.dimension),
  };
}
class RpcServerExposed implements VioServerExposed {
  constructor(vio: { chart: ChartCenter; tty: TtyCenter }, clientApi: RpcClientApi) {
    this.#clientApi = clientApi;
    this.#vio = vio;
  }
  #clientApi: RpcClientApi;
  #vio: { chart: ChartCenter; tty: TtyCenter };
  getCharts(): { list: ChartInfo<any>[] } {
    const list: ChartInfo<any>[] = new Array(this.#vio.chart.chartsNumber);
    let i = 0;
    for (const chart of this.#vio.chart.getAll()) {
      list[i++] = getChartInfo(chart);
    }
    return { list };
  }
  getChartInfo(id: number): ChartInfo<any> | undefined {
    const chart = this.#vio.chart.get(id);
    if (!chart) return;
    return getChartInfo(chart);
  }
  requestUpdateChart<T>(chartId: number): MaybePromise<RequestUpdateRes<T>> {
    return this.#vio.chart.requestUpdate<T>(chartId);
  }

  getTtyCache(id: number): TtyOutputsData[] {
    const tty = this.#vio.tty.getCreated(id);
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
        resolver = this.#vio.tty.setReader(ttyId, {
          read: (ttyId, requestId, data) => this.#clientApi.sendTtyReadRequest(ttyId, requestId, data),
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
class RpcClientApi implements VioClientExposed {
  constructor(api: MakeCallers<VioClientExposed>) {
    this.#api = api;
  }
  #api?: MakeCallers<VioClientExposed>;
  sendTtyReadRequest(ttyId: number, requestId: number, data: TtyInputsReq) {
    if (!this.#api) return Promise.reject(new Error("Viewer has been disposed"));
    CpCall.exec(this.#api.sendTtyReadRequest, ttyId, requestId, data);
  }
  writeTty(id: number, data: TtyOutputsData | TtyOutputsData): void {
    if (!this.#api) throw new Error("Viewer has been disposed");
    CpCall.exec(this.#api.writeTty, id, data);
  }
  createChart(chart: ChartCreateInfo): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.createChart, chart);
  }
  deleteChart(id: number): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.deleteChart, id);
  }
  writeChart(id: number, data: ChartUpdateData<any>): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.writeChart, id, data);
  }
  ttyReadEnableChange(ttyId: number, enable: boolean): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.ttyReadEnableChange, ttyId, enable);
  }
}

export function initWebsocket(vio: Vio, ws: WebSocket): { cpc: CpCall; clientApi: VioClientExposed } {
  const cpc = createWebSocketCpc(ws);
  const clientApi = new RpcClientApi(cpc.genCaller<VioClientExposed>());
  cpc.setObject(new RpcServerExposed(vio, clientApi));

  return { clientApi, cpc };
}
