import type { ChartCreateOption, VioChart } from "./chart/chart.type.ts";
import type { VioObject } from "./_object_base.type.ts";
import { TableRow, VioTable, Columns, TableCreateOption } from "./table/table.type.ts";

export * from "./chart/chart.type.ts";
export * from "./table/table.type.ts";
export * from "./_object_base.type.ts";
/**
 * @public
 * @category Chart
 */
export interface VioObjectCenter {
  disposeObject(object: VioObject): void;
  chartsNumber: number;

  /** 获取所有已 Vio 对象*/
  getAll(): IterableIterator<VioObject>;
}
/** @public */
export interface VioObjectCenter {
  /** 创建一维图表 */
  createChart<T = any>(dimension: 1, options?: ChartCreateOption<T>): VioChart<T>;
  /** 创建二维图表 */
  createChart<T = any>(dimension: 2, options?: ChartCreateOption<T[]>): VioChart<T[]>;
  /** 创建三维图表 */
  createChart<T = any>(dimension: 3, options?: ChartCreateOption<T[][]>): VioChart<T[][]>;
  createChart<T = any>(dimension: number, options?: ChartCreateOption<T>): VioChart<T>;

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
  /** @deprecated 改用 disposeObject  */
  disposeChart(chart: VioChart): void;
  /** @deprecated 已废弃 */
  get(chartId: number): VioChart | undefined;
}

/** @public */
export interface VioObjectCenter {
  createTable<T extends TableRow>(columns: Columns<T>[], option?: TableCreateOption): VioTable<T>;
}
