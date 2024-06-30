import {
  ChartUpdateData,
  ChartCreateInfo,
  VioChartImpl,
  ChartController,
  ChartInfo,
  VioChartCreateConfig,
  VioServerExposed,
  ChartDataItem,
} from "@asnc/vio/client";
import { EventTrigger } from "evlib";
import { MakeCallers } from "cpcall/web";

export class ChartsDataCenterService implements ChartController {
  constructor() {}
  #chartsMap = new Map<number, ChartClientAgent<unknown>>();
  /** @deprecated */
  readonly chartsMap: Map<number, ChartClientAgent<unknown>> = this.#chartsMap;
  get(id: number) {
    return this.#chartsMap.get(id);
  }
  getAll() {
    return this.#chartsMap.values();
  }
  get size() {
    return this.#chartsMap.size;
  }
  createChart(crateInfo: ChartCreateInfo): void {
    this.#chartsMap.set(crateInfo.id, new ChartClientAgent(crateInfo));
    this.createEvent.emit(crateInfo);
  }
  clearChart() {
    this.#chartsMap.clear();
    this.deleteEvent.emit(undefined);
  }
  setCache(chartsList: ChartInfo<any>[]) {
    for (const item of chartsList) {
      const { cacheList = [], ...reset } = item;
      const oldChart = this.get(item.id);
      const chart = new ChartClientAgent<any>({ ...reset, maxCacheSize: 500 });
      chart.pushCache(...cacheList);

      this.#chartsMap.set(item.id, chart);
    }
    this.createEvent.emit(undefined);
  }
  deleteChart(chartId: number): void {
    this.#chartsMap.delete(chartId);
    this.deleteEvent.emit(chartId);
  }
  writeChart(chartId: number, data: ChartUpdateData<any>): void {
    const instance = this.#chartsMap.get(chartId);
    if (!instance) {
      console.warn("Write unknown chart id:" + chartId);
      return;
    } else {
      instance.pushCache(data);
      //todo 更新其他数据
    }

    this.writeEvent.emit({ id: chartId, data });
  }
  async requestUpdate(chartId: number): Promise<void> {
    if (!this.#serverApi) throw new Error("没有连接");
    const chart = this.#chartsMap.get(chartId);
    if (!chart) throw new Error("图不存在");
    const res = await this.#serverApi.requestUpdateChart(chartId);
    if (!chart.lastDataItem || res.timestamp > chart.lastDataItem.timestamp) chart.pushCache(res);
  }
  #serverApi?: MakeCallers<Pick<VioServerExposed, "requestUpdateChart">>;
  init(serverApi?: MakeCallers<Pick<VioServerExposed, "requestUpdateChart">>) {
    this.#serverApi = serverApi;
  }
  /** 如果参数位undefined， 则是同时创建多个 */
  readonly createEvent = new EventTrigger<ChartCreateInfo | undefined>();
  /** 如果参数位undefined， 则是同时删除多个 */
  readonly deleteEvent = new EventTrigger<number | undefined>();
  readonly writeEvent = new EventTrigger<{ id: number; data: ChartUpdateData<any> }>();
}

export class ChartClientAgent<T = number> extends VioChartImpl<T> {
  constructor(config: VioChartCreateConfig<T>) {
    super(config);
  }
  pushCache(...items: ChartDataItem<T>[]): void {
    super.pushCache(...items);
    this.changeEvent.emit();
  }
  readonly changeEvent = new EventTrigger<void>();
  updateData(data: T, timeName?: string | undefined): void {
    this.pushCache({ data: data, timestamp: Date.now(), timeName: timeName });
  }
}
