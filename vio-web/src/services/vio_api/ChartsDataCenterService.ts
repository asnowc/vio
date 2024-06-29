import {
  ChartUpdateData,
  ChartCreateInfo,
  VioChart,
  VioChartImpl,
  DimensionalityReduction,
  ChartUpdateLowerOption,
  ChartController,
  ChartInfo,
} from "@asnc/vio/client";
import { EventTrigger } from "evlib";

export class ChartsDataCenterService implements ChartController {
  readonly chartsMap = new Map<number, ChartClientAgent<unknown>>();

  createChart(crateInfo: ChartCreateInfo): void {
    this.chartsMap.set(crateInfo.id, new ChartClientAgent(crateInfo));
    this.createEvent.emit(crateInfo);
  }
  clearChart() {
    this.chartsMap.clear();
    this.deleteEvent.emit(undefined);
  }
  setCache(chartsList: ChartInfo<any>[]) {
    for (const item of chartsList) {
      const chart = new ChartClientAgent<any>({ ...item, maxCacheSize: 500 });
      for (const dataItem of item.cacheData) {
        chart.updateData(dataItem);
      }
      this.chartsMap.set(item.id, chart);
    }
    this.createEvent.emit(undefined);
  }
  deleteChart(chartId: number): void {
    this.chartsMap.delete(chartId);
    this.deleteEvent.emit(chartId);
  }
  writeChart(chartId: number, data: ChartUpdateData<any>): void {
    const instance = this.chartsMap.get(chartId);
    if (!instance) {
      console.warn("Write unknown chart id:" + chartId);
      return;
    } else {
      instance.updateData(data.value);
      //todo 更新其他数据
    }

    this.writeEvent.emit({ id: chartId, data });
  }
  /** 如果参数位undefined， 则是同时创建多个 */
  readonly createEvent = new EventTrigger<ChartCreateInfo | undefined>();
  /** 如果参数位undefined， 则是同时删除多个 */
  readonly deleteEvent = new EventTrigger<number | undefined>();
  readonly writeEvent = new EventTrigger<{ id: number; data: ChartUpdateData<any> }>();
}
export class ChartClientAgent<T = number> extends VioChartImpl<T> {
  constructor(config: ConstructorParameters<typeof VioChartImpl>[0]) {
    super(config);
  }
  readonly changeEvent = new EventTrigger<void>();
  updateData(data: T, name?: string | undefined): void {
    super.updateData(data, name);
    this.changeEvent.emit();
  }
  updateSubData(updateData: DimensionalityReduction<T>, coord: number, opts?: ChartUpdateLowerOption): void {
    super.updateSubData(updateData, coord, opts);
    this.changeEvent.emit();
  }
}
