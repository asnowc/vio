import type { VioChart, ChartCreateOption } from "./chart/chart.type.ts";
import { VioChart as RpcVioChart } from "./chart/VioChart.ts";
import { UniqueKeyMap } from "evlib/data_struct";
import { VioChartBase } from "./chart/VioChartBase.ts";
import type { ChartController } from "../api_type.ts";
import type { VioObject } from "./object.type.ts";

/**
 * @public
 * @category Chart
 */
export class VioObjectCenter {
  /** 图表默认缓存数量 */
  static CHART_DEFAULT_CACHE_SIZE = 20;
  constructor(private ctrl: ChartController) {}
  #instanceMap = new UniqueKeyMap<VioObject>(2 ** 32);
  getChart(chartId: number): VioChart | undefined {
    const obj = this.#instanceMap.get(chartId);
    if (obj instanceof RpcVioChart) {
      return obj;
    }
  }
  get(chartId: number): VioObject | undefined {
    return this.#instanceMap.get(chartId);
  }
  /** 获取所有已 Vio 对象*/
  getAll(): IterableIterator<VioObject> {
    return this.#instanceMap.values();
  }
  /** 所有 Vio 对象数量 */
  get chartsNumber(): number {
    return this.#instanceMap.size;
  }
  /** 创建一维图表 */
  createChart<T = any>(dimension: 1, options?: ChartCreateOption<T>): VioChart<T>;
  /** 创建二维图表 */
  createChart<T = any>(dimension: 2, options?: ChartCreateOption<T[]>): VioChart<T[]>;
  /** 创建三维图表 */
  createChart<T = any>(dimension: 3, options?: ChartCreateOption<T[][]>): VioChart<T[][]>;
  createChart<T = any>(dimension: number, options?: ChartCreateOption<T>): VioChart<T>;
  createChart(dimension: number, options?: ChartCreateOption<any>): VioChart<any> {
    let chartId = this.#instanceMap.allocKeySet(null as any);
    const chart = new RpcVioChart(this.ctrl, chartId, dimension, {
      ...options,
      maxCacheSize: options?.maxCacheSize ?? VioObjectCenter.CHART_DEFAULT_CACHE_SIZE,
    });
    this.#instanceMap.set(chartId, chart);
    this.ctrl.createObject({ id: chartId, name: chart.name, type: chart.type });

    return chart;
  }

  /**
   * 创建一维图表
   * @deprecated 改用 createChart
   */
  create<T = any>(dimension: 1, options?: ChartCreateOption<T>): VioChart<T>;
  /** 创建二维图表
   * @deprecated 改用 createChart */
  create<T = any>(dimension: 2, options?: ChartCreateOption<T[]>): VioChart<T[]>;
  /** 创建三维图表
   * @deprecated 改用 createChart */
  create<T = any>(dimension: 3, options?: ChartCreateOption<T[][]>): VioChart<T[][]>;
  /** @deprecated 改用 createChart */
  create<T = any>(dimension: number, options?: ChartCreateOption<T>): VioChart<T>;
  create(dimension: number, options?: ChartCreateOption<any>) {
    return this.createChart(dimension, options);
  }

  disposeObject(chart: VioObject) {
    if (chart instanceof RpcVioChart) {
      chart.dispose();
    } else {
      throw new Error("This chart does not belong to the center");
    }
    this.#instanceMap.delete(chart.id);
  }
  /**
   * @deprecated 改用 disposeObject
   */
  disposeChart(chart: VioChart) {
    this.disposeObject(chart);
  }
}

/**
 * @public
 * @category Chart
 * @deprecated 改用 VioObjectCenter
 */
export class ChartCenter extends VioObjectCenter {
  get(chartId: number): VioChart | undefined {
    return this.getChart(chartId);
  }
  *getAll(): IterableIterator<VioChart> {
    for (const item of this.getAll()) {
      if (item instanceof VioChartBase) yield item;
    }
  }
}
