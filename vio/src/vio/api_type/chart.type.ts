/**
 * 一个图表的信息
 * @public
 * @category Chart
 */
export interface ChartInfo<T = number> {
  id: number;
  /** 维度 */
  dimension: number;
  cacheData: T[];

  /** 维度刻度名称 */
  dimensionIndexNames: ((string | undefined)[] | undefined)[];
  meta: VioChartMeta;
}
/** @public */
export type ChartCreateInfo = Pick<ChartInfo, "id" | "dimension"> & {
  meta?: VioChartMeta;
  /** 维度刻度名称 */
  dimensionIndexNames?: ((string | undefined)[] | undefined)[];
};

export type ChartUpdateData<T = number> = {
  /** 时间刻度名称 */
  timeAxisName?: string;
  /** 时间刻度(时间戳) */
  timestamp: number;
} & (
  | {
      coord: number | (number | undefined)[];
      dimensionIndexNames?: (string | null | undefined)[];
      value: IntersectingDimension<T>;
    }
  | { coord: number; dimensionIndexNames?: string; value: DimensionalityReduction<T> }
  | {
      coord?: undefined;
      /** 维度刻度名称 */
      dimensionIndexNames?: ((string | undefined | null)[] | undefined | null)[];
      value: T;
    }
);
/** @public */
export type IntersectingDimension<T> = T extends Array<infer P> ? P | IntersectingDimension<P> : never;

/** @public */
export type DimensionalityReduction<T> = T extends Array<infer P> ? P : never;

/** @public */
export type VioChartType = VioChartMeta["chartType"];

/** @public */
export type RequestUpdateRes<T> = { value: T; timestamp: number };

/** @public */
export type VioChartMeta =
  | ChartMeta.Progress
  | ChartMeta.Gauge
  // | ChartMeta.Timeline
  | ChartMeta.Line
  | ChartMeta.Bar
  | ChartMeta.Pie
  | { [key: string]: any };

/** @public */
export namespace ChartMeta {
  /* 一维图 */

  /** 进度条 */
  export interface Progress {
    chartType: "progress";
    title?: string;
    color?: string;
  }
  /** 仪表盘 */
  export interface Gauge {
    chartType: "gauge";
    min: number;
    max: number;
    title?: string;
    unit?: string;
  }
  /** 时间线/时间节点 */
  // interface Timeline {
  //   chartType: "timeline";
  //   title?: string;
  // }

  /* 二维图 */

  /** 折/曲线图 */
  export interface Line {
    chartType: "line";
    title?: string;
  }
  /** 柱状图 */
  export interface Bar {
    chartType: "bar";
    title?: string;
    sort?: 0 | 1;
  }

  /** 饼图 */
  export interface Pie {
    chartType: "pie";
    title?: string;
  }
  /** 散点图 */
  export interface Scatter {
    chartType: "scatter";
    title?: string;
  }
}
