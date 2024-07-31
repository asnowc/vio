import { MaybePromise } from "../../../type.ts";
import { VioObject } from "../_object_base.type.ts";

/**
 * 一个图表的信息
 * @public
 * @category Chart
 */
export interface ChartInfo<T = number> {
  id: number;
  name?: string;
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
    /** 图表题 */
    title?: string;
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
    enableTimeline?: boolean;
    chartType: "line";
  }
  /** 柱状图 */
  export interface Bar extends Common {
    enableTimeline?: boolean;
    chartType: "bar";
    sort?: 0 | 1;
  }
  /** 散点图 */
  export interface Scatter extends Common {
    enableTimeline?: boolean;
    chartType: "scatter";
  }

  /** 饼图 */
  export interface Pie extends Common {
    chartType: "pie";
  }
}

/**
 * VIO Chart
 * @public
 * @category Chart
 */
export interface VioChart<T = number> extends VioObject {
  data?: T;
  cachedSize: number;
  maxCacheSize: number;

  /** 请求更新节流。单位毫秒 */
  updateThrottle: number;
  /** 主动请求更新的回调函数 */
  onRequestUpdate?: () => MaybePromise<T>;
  /** web 端主动请求更新图表，这会触发 chart.onRequestUpdate() */
  requestUpdate(): MaybePromise<RequestUpdateRes<T>>;
  getCacheDateItem(): IterableIterator<Readonly<ChartDataItem<T>>>;
  /** 获取缓存中的数据 */
  getCacheData(): IterableIterator<T>;
  /** 更新图表数据。并将数据推入缓存 */
  updateData(data: T, timeName?: string): void;
  /** 维度信息 */
  readonly dimensions: ArrayLike<DimensionInfo>;
  /** 维度数量 */
  readonly dimension: number;
  readonly meta: VioChartMeta;
  readonly type: "chart";
}

/**
 * VioChart 创建配置
 * @public
 * @category Chart
 */
export type VioChartCreateConfig<T = unknown> = ChartCreateOption<T> & {
  /** {@inheritdoc VioObject.id} */
  id: number;
  /** {@inheritdoc VioChart.dimension} */
  dimension: number;
};
/**
 * VioChart 创建可选项
 * @public
 * @category Chart
 */
export type ChartCreateOption<T = unknown> = {
  name?: string;
  /** {@inheritdoc VioChart.meta} */
  meta?: VioChartMeta;
  /** {@inheritdoc VioChart.dimensions} */
  dimensions?: Record<number, DimensionInfo | undefined>;
  /** {@inheritdoc VioChart.maxCacheSize} */
  maxCacheSize?: number;
  /** {@inheritdoc VioChart.updateThrottle} */
  updateThrottle?: number;
  /** {@inheritdoc VioChart.onRequestUpdate} */
  onRequestUpdate?(): MaybePromise<T>;
};
/**
 * @public
 * @category Chart
 */
export type ChartUpdateOption = {
  /** 时间轴刻度名称 */
  timeName?: string;
};
/**
 * @public
 * @category Chart
 */
export type ChartUpdateLowerOption = {
  /** {@inheritdoc ChartUpdateOption.timeName} */
  timeName?: string;
};
