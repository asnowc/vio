import type {
  ChartUpdateData,
  DimensionalityReduction,
  IntersectingDimension,
  RequestUpdateRes,
} from "../api_type/chart.type.ts";
import { UniqueKeyMap } from "evlib/data_struct";
import { deepClone } from "evlib";
import {
  ChartUpdateLowerOption,
  ChartUpdateOption,
  VioChart,
  VioChartImpl,
  VioChartCreateConfig,
  ChartCreateOption,
} from "./VioChart.ts";
import { indexRecordToArray } from "../../lib/array_like.ts";
import { ChartController } from "../api_type.ts";
import { MaybePromise } from "../../type.ts";

/**
 * @public
 * @category Chart
 */
export class ChartCenter {
  static TTY_DEFAULT_CACHE_SIZE = 20;
  constructor(private ctrl: ChartController) {}
  #instanceMap = new UniqueKeyMap<RpcVioChart>(2 ** 32);
  /** 获取指定索引的 Chart */
  get(chartId: number): VioChart<unknown> | undefined {
    return this.#instanceMap.get(chartId);
  }
  /** 获取所有已创建的 Chart */
  getAll(): IterableIterator<VioChart<unknown>> {
    return this.#instanceMap.values();
  }
  get chartsNumber() {
    return this.#instanceMap.size;
  }

  create<T = any>(dimension: 1, options?: CenterCreateChartOption<T>): VioChart<T>;
  create<T = any>(dimension: 2, options?: CenterCreateChartOption<T[]>): VioChart<T[]>;
  create<T = any>(dimension: 3, options?: CenterCreateChartOption<T[][]>): VioChart<T[][]>;
  create<T = any>(dimension: number, options?: CenterCreateChartOption<T>): VioChart<T>;
  create(dimension: number, options: CenterCreateChartOption<any>): VioChart<any> {
    let chartId = this.#instanceMap.allocKeySet(null as any);
    const { maxCacheSize = ChartCenter.TTY_DEFAULT_CACHE_SIZE } = options;
    const chart = new ChartCenter.Chart(this, {
      ...options,
      id: chartId,
      dimension,
      maxCacheSize,
    });
    this.#instanceMap.set(chartId, chart);
    this.ctrl.createChart({
      meta: options.meta,
      dimension: chart.dimension,
      id: chartId,
      dimensionIndexNames: indexRecordToArray(chart.dimensionIndexNames, chart.dimension),
    });

    return chart;
  }
  requestUpdate<T>(chartId: number): MaybePromise<RequestUpdateRes<T>> {
    const chart = this.#instanceMap.get(chartId);
    if (!chart?.onUpdate) return { ok: false };
    return chart.onUpdate() as MaybePromise<RequestUpdateRes<T>>;
  }
  disposeChart(chart: VioChart<unknown>) {
    if (!(chart instanceof ChartCenter.Chart)) throw new Error("This chart does not belong to the center");
    chart.dispose();
  }
  private static Chart = class RpcVioChart<T> extends VioChartImpl<T> {
    constructor(center: ChartCenter, opts: VioChartCreateConfig) {
      super(opts);
      this.#center = center;
    }
    onUpdate?: () => MaybePromise<RequestUpdateRes<T>>;
    #center?: ChartCenter;
    /** @override */
    updateData(data: T, timeAxisName?: string) {
      if (!this.#center) return;
      this.#center.ctrl.writeChart(this.id, { value: data, timeAxisName: timeAxisName });
      if (this.maxCacheSize <= 0) return;
      let internalData = typeof data === "object" ? deepClone(data) : data;
      super.updateData(internalData);
    }
    updateSubData(updateData: DimensionalityReduction<T>, coord: number, opts?: ChartUpdateLowerOption): void;
    updateSubData(updateData: IntersectingDimension<T>, coord: (number | undefined)[], opts?: ChartUpdateOption): void;
    /** @override */
    updateSubData(
      updateData: IntersectingDimension<T>,
      coord: number | (number | undefined)[],
      opts?: ChartUpdateLowerOption | ChartUpdateOption,
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

type RpcVioChart = InstanceType<(typeof ChartCenter)["Chart"]>;

export type {
  ChartInfo,
  DimensionalityReduction,
  IntersectingDimension,
  ChartMeta,
  VioChartMeta,
  VioChartType,
  RequestUpdateRes,
} from "../api_type/chart.type.ts";

/**
 * VioChart 构造函数的选项
 * @public
 * @category Chart
 */
export type CenterCreateChartOption<T = unknown> = ChartCreateOption & {
  onUpdate?(): MaybePromise<RequestUpdateRes<T>>;
};
