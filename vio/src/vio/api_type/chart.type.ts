/**
 * 一个图表的信息
 * @public
 * @category Chart
 */
export interface ChartInfo<T = number> {
  id: number;
  cacheList: ChartDataItem<T>[];
  /** 维度数量。不包含时间维度 */
  dimension: number;
  /** 维度信息 */
  dimensions: DimensionInfo[];
  meta: VioChartMeta;
}
/**
 * 维度的信息
 * @public
 * @category Chart
 */
export interface DimensionInfo {
  /** 维度名称 */
  name?: string;
  /** 维度单位 */
  unitName?: string;
  indexNames?: string[];
}

/** @public */
export type ChartCreateInfo = Pick<ChartInfo, "id" | "dimension" | "dimensions"> & {
  meta?: VioChartMeta;
};
type ChartUpdateCommonData = {
  /** 时间刻度名称 */
  timeAxisName?: string;
  /** 时间刻度(时间戳) */
  timestamp: number;
};
export type ChartUpdateData<T = number> = ChartUpdateCommonData & {
  coord?: undefined;
  data: T;
};
export type ChartUpdateSubData<T = number> =
  | ChartUpdateCommonData
  | {
      coord: number | (number | undefined)[];
      data: IntersectingDimension<T>;
    }
  | { coord: number; data: DimensionalityReduction<T> };

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
    title?: string;
    enableTimeline?: boolean;
    /** web 端自动请求的时间间隔，单位毫秒 */
    requestInterval?: number;
  };

  /** 进度条 */
  export interface Progress extends Common {
    chartType: "progress";
    color?: string;
  }
  /** 仪表盘 */
  export interface Gauge extends Common {
    chartType: "gauge";
    min: number;
    max: number;
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
  }
  /** 柱状图 */
  export interface Bar extends Common {
    chartType: "bar";
    sort?: 0 | 1;
  }

  /** 饼图 */
  export interface Pie extends Common {
    chartType: "pie";
  }
  /** 散点图 */
  export interface Scatter extends Common {
    chartType: "scatter";
  }
}
