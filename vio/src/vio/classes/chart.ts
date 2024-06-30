import type {
  ChartUpdateData,
  DimensionalityReduction,
  IntersectingDimension,
  RequestUpdateRes,
} from "../api_type/chart.type.ts";
import { UniqueKeyMap } from "evlib/data_struct";
import { deepClone } from "evlib";
import { ChartUpdateLowerOption, ChartUpdateOption, VioChart, VioChartImpl, ChartCreateOption } from "./VioChart.ts";
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
  get chartsNumber(): number {
    return this.#instanceMap.size;
  }

  create<T = any>(dimension: 1, options?: CenterCreateChartOption<T>): VioChart<T>;
  create<T = any>(dimension: 2, options?: CenterCreateChartOption<T[]>): VioChart<T[]>;
  create<T = any>(dimension: 3, options?: CenterCreateChartOption<T[][]>): VioChart<T[][]>;
  create<T = any>(dimension: number, options?: CenterCreateChartOption<T>): VioChart<T>;
  create(dimension: number, options?: CenterCreateChartOption<any>): VioChart<any> {
    let chartId = this.#instanceMap.allocKeySet(null as any);
    const chart = new ChartCenter.Chart(this, chartId, dimension, options);
    this.#instanceMap.set(chartId, chart);
    this.ctrl.createChart({
      meta: chart.meta,
      dimension: chart.dimension,
      id: chartId,
      dimensionIndexNames: indexRecordToArray(chart.dimensionIndexNames, chart.dimension),
    });

    return chart;
  }
  requestUpdate<T>(chartId: number): MaybePromise<RequestUpdateRes<T>> {
    const chart = this.#instanceMap.get(chartId);
    if (!chart) throw new Error(`Chart '${chartId}' dest not exist`);
    return chart.onUpdate() as MaybePromise<RequestUpdateRes<T>>;
  }
  disposeChart(chart: VioChart<unknown>) {
    if (!(chart instanceof ChartCenter.Chart)) throw new Error("This chart does not belong to the center");
    chart.dispose();
  }
  private static Chart = class RpcVioChart<T> extends VioChartImpl<T> {
    constructor(center: ChartCenter, chartId: number, dimension: number, options: CenterCreateChartOption<T> = {}) {
      const { maxCacheSize = ChartCenter.TTY_DEFAULT_CACHE_SIZE } = options;
      super({
        ...options,
        id: chartId,
        dimension,
        maxCacheSize,
      });
      this.#center = center;
    }
    #lastData?: MaybePromise<RequestUpdateRes<T>>;

    onUpdate(): MaybePromise<RequestUpdateRes<T>> {
      if (!this.onRequestUpdate) throw new Error("Requests for updates are not allowed");
      const timestamp = Date.now();

      if (this.#lastData) {
        if (this.#lastData instanceof Promise) return this.#lastData;
        if (timestamp - this.#lastData.timestamp <= this.updateThrottle) return this.#lastData;
      }

      const value = this.onRequestUpdate();
      let res: MaybePromise<RequestUpdateRes<T>>;
      if (value instanceof Promise)
        res = value.then(
          (value): Readonly<RequestUpdateRes<T>> => {
            let res = { data: value, timestamp: timestamp } as const;
            this.pushCache({ data: value, timestamp });
            this.#lastData = res;
            return res;
          },
          (e) => {
            this.#lastData = undefined;
            throw e;
          },
        );
      else {
        res = { data: value, timestamp: timestamp };
        this.pushCache({ data: value, timestamp });
      }
      this.#lastData = res;
      return res;
    }
    #center?: ChartCenter;
    /** @override */
    updateData(data: T, timeName?: string): void {
      if (!this.#center) return;
      let internalData = typeof data === "object" ? deepClone(data) : data;

      const timestamp = Date.now();
      this.pushCache({ data: internalData, timestamp, timeName });

      const writeData: ChartUpdateData<any> = { data: internalData, timestamp: timestamp, timeAxisName: timeName };
      this.#center.ctrl.writeChart(this.id, writeData);
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
      const timestamp = Date.now();
      this.#center.ctrl.writeChart(this.id, {
        data: updateData,
        coord: coord,
        dimensionIndexNames: opts?.dimensionIndexNames,
        timestamp: timestamp,
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
  ChartDataItem,
} from "../api_type/chart.type.ts";

/**
 * VioChart 构造函数的选项
 * @public
 * @category Chart
 */
export type CenterCreateChartOption<T = unknown> = ChartCreateOption & {
  /** 主动请求更新的回调函数 */
  onRequestUpdate?(): MaybePromise<T>;
  /** 请求更新节流。单位毫秒 */
  updateThrottle?: number;
};
