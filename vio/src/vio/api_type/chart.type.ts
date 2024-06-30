/**
 * 一个图表的信息
 * @public
 * @category Chart
 */
export interface ChartInfo<T = number> {
  id: number;
  /** 维度 */
  dimension: number;
  cacheList: ChartDataItem<T>[];
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
      data: IntersectingDimension<T>;
    }
  | { coord: number; dimensionIndexNames?: string; data: DimensionalityReduction<T> }
  | {
      coord?: undefined;
      /** 维度刻度名称 */
      dimensionIndexNames?: ((string | undefined | null)[] | undefined | null)[];
      data: T;
    }
);
/** @public */
export type IntersectingDimension<T> = T extends Array<infer P> ? P | IntersectingDimension<P> : never;

/** @public */
export type DimensionalityReduction<T> = T extends Array<infer P> ? P : never;

/** @public */
export type VioChartType = VioChartMeta["chartType"];
/**
 * @public
 * @category Chart
 */
export interface ChartDataItem<T = number> {
  data: T;
  timestamp: number;
  timeName?: string;
}

/** @public */
export type RequestUpdateRes<T> = {
  data: T;
  timestamp: number;
};

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
  export type Common = {
    enableTimeline?: boolean;
    requestInternal?: number;
  };

  /** 进度条 */
  export interface Progress extends Common {
    chartType: "progress";
    title?: string;
    color?: string;
  }
  /** 仪表盘 */
  export interface Gauge extends Common {
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
  export interface Line extends Common {
    chartType: "line";
    title?: string;
  }
  /** 柱状图 */
  export interface Bar extends Common {
    chartType: "bar";
    title?: string;
    sort?: 0 | 1;
  }

  /** 饼图 */
  export interface Pie extends Common {
    chartType: "pie";
    title?: string;
  }
  /** 散点图 */
  export interface Scatter extends Common {
    chartType: "scatter";
    title?: string;
  }
}
