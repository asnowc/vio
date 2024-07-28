import { CpCall, MakeCallers, createWebSocketCpc } from "cpcall";
import type {
  VioClientExposed,
  TtyOutputsData,
  VioServerExposed,
  TtyInputsReq,
  VioObjectCreateDto,
  ChartUpdateData,
  VioObjectDto,
  ClientTtyExposed,
  ClientChartExposed,
  ServerTtyExposed,
  ServerChartExposed,
  ServerObjectExposed,
  ClientObjectExposed,
} from "../vio/api_type.ts";
import {
  TtyCenter,
  VioObjectCenter,
  Vio,
  VioChart,
  TtyReadResolver,
  ChartInfo,
  RequestUpdateRes,
  ChartDataItem,
} from "../vio/mod.ts";
import type { WebSocket } from "../lib/deno/http.ts";
import { MaybePromise } from "../type.ts";
import { indexRecordToArray } from "../lib/array_like.ts";

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

class RpcServerChartExposed implements ServerChartExposed {
  constructor(vio: Vio) {
    this.#chart = vio.object;
  }
  #chart: VioObjectCenter;
  getChartInfo(id: number): ChartInfo<any> | undefined {
    const chart = this.#chart.getChart(id);
    if (!chart) return;
    return RpcServerChartExposed.getChartInfo(chart, id);
  }
  requestUpdateChart<T>(chartId: number): MaybePromise<RequestUpdateRes<T>> {
    const chart = this.#chart.getChart(chartId);
    if (!chart) throw new Error(`The id ${chartId} is not a Chart`);
    return chart.requestUpdate() as MaybePromise<RequestUpdateRes<T>>;
  }
  private static getChartInfo<T>(chart: VioChart<T>, id: number): ChartInfo<T> {
    const cacheList: ChartDataItem<T>[] = new Array(chart.cachedSize);
    let i = 0;
    for (const item of chart.getCacheDateItem()) {
      let dataItem: ChartDataItem<T> = { data: item.data, timestamp: item.timestamp };
      if (item.timeName) dataItem.timeName = item.timeName;
      cacheList[i++] = dataItem;
    }
    return {
      name: chart.name,
      meta: chart.meta,
      dimension: chart.dimension,
      id,
      cacheList,
      dimensions: indexRecordToArray(chart.dimensions),
    };
  }
}
class RpcServerObjectExposed implements ServerObjectExposed {
  constructor(vio: Vio) {
    this.#chart = vio.object;
  }
  #chart: VioObjectCenter;
  getObjects(): { list: VioObjectDto[] } {
    const list = new Array<VioObjectDto>(this.#chart.chartsNumber);
    let i = 0;
    for (const item of this.#chart.getAll()) {
      list[i++] = { id: item.id, type: item.type, name: item.name };
    }
    return { list };
  }
}

export class ClientTtyApi implements ClientTtyExposed {
  constructor(api: MakeCallers<VioClientExposed>) {
    this.#api = api;
  }
  #api?: MakeCallers<VioClientExposed>;
  sendTtyReadRequest(ttyId: number, requestId: number, data: TtyInputsReq) {
    if (!this.#api) return Promise.reject(new Error("Viewer has been disposed"));
    CpCall.exec(this.#api.tty.sendTtyReadRequest, ttyId, requestId, data);
  }
  writeTty(id: number, data: TtyOutputsData | TtyOutputsData): void {
    if (!this.#api) throw new Error("Viewer has been disposed");
    CpCall.exec(this.#api.tty.writeTty, id, data);
  }
  ttyReadEnableChange(ttyId: number, enable: boolean): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.tty.ttyReadEnableChange, ttyId, enable);
  }
}

export class ClientObjectApi implements ClientChartExposed, ClientObjectExposed {
  constructor(api: MakeCallers<VioClientExposed>) {
    this.#api = api;
  }
  #api?: MakeCallers<VioClientExposed>;

  createObject(info: VioObjectCreateDto): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.object.createObject, info);
  }
  deleteObject(id: number): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.object.deleteObject, id);
  }

  writeChart(id: number, data: ChartUpdateData<any>): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.chart.writeChart, id, data);
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
    object: new RpcServerObjectExposed(vio),
    chart: new RpcServerChartExposed(vio),
    tty: new RpcServerTtyExposed(vio, ttyApi),
  } satisfies VioServerExposed);

  return { clientApi: { object: objectApi, tty: ttyApi }, cpc };
}
