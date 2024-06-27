import type { ChartInfo, ChartUpdateData, DimensionalityReduction, IntersectingDimension } from "../api_type/chart.type.ts";
import { UniqueKeyMap } from "evlib/data_struct";
import { deepClone } from "evlib";
import { VioChartUpdateLowerOpts, VioChartUpdateOpts, VioChart, VioChartCreateConfig } from "./VioChart.ts";
import { indexRecordToArray } from "../../lib/array_like.ts";
import { ChartController } from "../api_type.ts";

function getChartInfo<T>(chart: VioChart<T>): ChartInfo<T> {
  return {
    meta: chart.meta,
    dimension: chart.dimension,
    id: chart.id,
    cacheData: chart.cacheData,
    dimensionIndexNames: indexRecordToArray(chart.dimensionIndexNames, chart.dimension),
  };
}
/** @public */
export class ChartCenter {
  static TTY_DEFAULT_CACHE_SIZE = 20;
  constructor(private ctrl: ChartController) {}
  #instanceMap = new UniqueKeyMap<VioChart<unknown>>(2 ** 32);
  /** 获取指定索引的 Chart. 如果不存在，则创建后返回 */
  get(chartId: number): VioChart<unknown> | undefined {
    return this.#instanceMap.get(chartId);
  }
  /** 获取所有已创建的 Chart */
  getAll() {
    return this.#instanceMap.values();
  }
  /** 获取指定索引的 Chart 数据. 如果不存在，则创建后返回 */
  getInfo(chartId: number): ChartInfo<unknown> | undefined {
    const chart = this.#instanceMap.get(chartId);
    if (chart) return getChartInfo(chart);
  }
  /** 获取所有已创建的 Chart 数据 */
  getAllInfo<T = any>(): ChartInfo<T>[] {
    const list: ChartInfo<any>[] = new Array(this.#instanceMap.size);
    let i = 0;
    for (const chart of this.#instanceMap.values()) {
      list[i++] = getChartInfo(chart);
    }
    return list;
  }
  create<T = any>(dimension: 1, config: CreateChartOpts): VioChart<T>;
  create<T = any>(dimension: 2, config: CreateChartOpts): VioChart<T[]>;
  create<T = any>(dimension: 3, config: CreateChartOpts): VioChart<T[][]>;
  create<T = any>(dimension: number, config: CreateChartOpts): VioChart<T>;
  create(dimension: number, config: CreateChartOpts): VioChart<any> {
    let chartId = this.#instanceMap.allowKeySet(null as any);
    const { maxCacheSize = ChartCenter.TTY_DEFAULT_CACHE_SIZE } = config;
    const chart = new ChartCenter.Chart(this, {
      ...config,
      id: chartId,
      dimension,
      maxCacheSize,
    });
    this.#instanceMap.set(chartId, chart);
    this.ctrl.createChart({
      meta: config.meta,
      dimension: chart.dimension,
      id: chartId,
      dimensionIndexNames: indexRecordToArray(chart.dimensionIndexNames, chart.dimension),
    });

    return chart;
  }
  disposeChart(chart: VioChart<unknown>) {
    if (!(chart instanceof ChartCenter.Chart)) throw new Error("This chart does not belong to the center");
    chart.dispose();
  }
  private static Chart = class RpcVioChart<T> extends VioChart<T> {
    constructor(center: ChartCenter, opts: VioChartCreateConfig) {
      super(opts);
      this.#center = center;
    }
    get cacheData(): T[] {
      return Array.from(this.getCacheData());
    }
    #center?: ChartCenter;

    updateData(data: T, timeAxisName?: string) {
      if (!this.#center) return;
      this.#center.ctrl.writeChart(this.id, { value: data, timeAxisName: timeAxisName });
      if (this.maxCacheSize <= 0) return;
      let internalData = typeof data === "object" ? deepClone(data) : data;
      super.updateData(internalData);
    }

    updateSubData(updateData: DimensionalityReduction<T>, coord: number, opts?: VioChartUpdateLowerOpts): void;
    updateSubData(updateData: IntersectingDimension<T>, coord: (number | undefined)[], opts?: VioChartUpdateOpts): void;
    updateSubData(
      updateData: IntersectingDimension<T>,
      coord: number | (number | undefined)[],
      opts?: VioChartUpdateLowerOpts | VioChartUpdateOpts,
    ): void {
      if (!this.#center) return;
      this.#center.ctrl.writeChart(this.id, {
        value: updateData,
        timeAxisName: opts?.timeName,
        coord: coord,
        dimensionIndexNames: opts?.dimensionIndexNames,
      } as ChartUpdateData);
      if (this.maxCacheSize <= 0) return;
      //@ts-ignore
      super.updateSubData(updateData, coord, opts);
    }
    get disposed() {
      return !this.#center;
    }
    dispose() {
      if (!this.#center) return;
      const center = this.#center;
      this.#center = undefined;
      const id = this.id;
      center.#instanceMap.delete(id);
      center.ctrl.deleteChart(id);
    }
  };
}
export type {
  ChartInfo,
  DimensionalityReduction,
  IntersectingDimension,
  ChartMeta,
  VioChartMeta,
  VioChartType,
} from "../api_type/chart.type.ts";
/**  VioChart 构造函数的选项
 * @public */
export type CreateChartOpts = Omit<VioChartCreateConfig, "id" | "dimension">;
