import type {
  ChartDataItem,
  DimensionInfo,
  DimensionalityReduction,
  IntersectingDimension,
  VioChartMeta,
} from "../api_type.ts";
import { LinkedCacheQueue } from "evlib/data_struct";
import { deepClone } from "evlib";
import { IndexRecord } from "../../lib/array_like.ts";
import { MaybePromise } from "../../type.ts";

export abstract class VioChartImpl<T = number> implements VioChart<T> {
  constructor(config: VioChartCreateConfig<T>) {
    const { dimensions, dimension, maxCacheSize = 0, meta, onRequestUpdate, updateThrottle = 0 } = config;
    if (!(dimension >= 0)) throw new RangeError("dimension must be a positive integer");
    this.#cache = new LinkedCacheQueue<ChartDataItem<T>>(maxCacheSize);
    this.dimension = dimension;
    this.id = config.id;

    const finalDimension: IndexRecord<DimensionInfo> = { length: dimension };
    Object.defineProperty(finalDimension, "length", {
      value: dimension,
      configurable: false,
      enumerable: true,
      writable: false,
    });
    if (dimensions) {
      for (let i = 0; i < dimension; i++) {
        const item = dimensions[i];
        finalDimension[i] = typeof item === "object" && item ? item : {};
      }
    } else {
      for (let i = 0; i < dimension; i++) {
        finalDimension[i] = {};
      }
    }
    this.dimensions = finalDimension;
    this.meta = { ...meta };
    this.updateThrottle = updateThrottle;
    this.onRequestUpdate = onRequestUpdate;
  }

  updateThrottle: number;
  onRequestUpdate?: () => MaybePromise<T>;

  #cache: LinkedCacheQueue<ChartDataItem<T>>;
  /** 已缓存的数据长度 */
  get cachedSize(): number {
    return this.#cache.size;
  } /** 缓存容量 */
  get maxCacheSize(): number {
    return this.#cache.maxSize;
  }
  set maxCacheSize(size: number) {
    this.#cache.maxSize = size;
  }
  get data(): T | undefined {
    return this.lastDataItem?.data;
  }
  get lastDataItem(): Readonly<Readonly<ChartDataItem<T>>> | undefined {
    return this.#cache.last;
  }
  get headDataItem(): Readonly<Readonly<ChartDataItem<T>>> | undefined {
    return this.#cache.head;
  }
  protected pushCache(...items: ChartDataItem<T>[]) {
    for (let i = 0; i < items.length; i++) {
      this.#cache.push(items[i]);
    }
  }
  /** 遍历时间维度上的数据 */
  getCacheDateItem(): Generator<Readonly<ChartDataItem<T>>, void, void> {
    return this.#cache[Symbol.iterator]();
  }
  /** 获取缓存中的数据 */
  *getCacheData(): Generator<T, void, void> {
    for (const item of this.#cache) {
      yield item.data;
    }
  }
  /** 更新图表数据。并将数据推入缓存 */
  abstract updateData(data: T, timeName?: string): void;

  private updateLowerOneDimension(updateData: IntersectingDimension<T>, coord: number) {
    const current = this.data!;
    if (!current) throw new Error("Data no exist");
    if (!(current instanceof Array)) throw new Error("Unable to update data for dimension 0");

    let data = new Array(current.length);

    for (let i = 0; i < data.length; i++) {
      if (i === coord) data[i] = updateData;
      else data[i] = typeof current[i] === "object" ? deepClone(current[i]) : current[i];
    }
    this.updateData(data as T);
  }
  /** 降一个维度更新数据 */
  protected updateSubData(updateData: DimensionalityReduction<T>, coord: number, option?: ChartUpdateLowerOption): void;
  // updateSubData(updateData: IntersectingDimension<T>, coord: (number | undefined)[], option?: ChartUpdateLowerOption): void;
  protected updateSubData(updateData: IntersectingDimension<T>, coord: (number | undefined)[] | number): void {
    if (typeof coord === "number") {
      return this.updateLowerOneDimension(updateData, coord);
    }
    //TODO: 实现更细维度的数据更新
    throw new Error("未实现");
    // this.updateData(data);
  }
  /** 维度信息 */
  readonly dimensions: IndexRecord<DimensionInfo>;
  /** 维度数量 */
  readonly dimension: number;
  readonly id: number;
  readonly meta: VioChartMeta;
}
/**
 * VIO Chart
 * @public
 * @category Chart
 */
export interface VioChart<T = number> {
  data?: T;
  cachedSize: number;
  maxCacheSize: number;

  /** 请求更新节流。单位毫秒 */
  updateThrottle: number;
  /** 主动请求更新的回调函数 */
  onRequestUpdate?: () => MaybePromise<T>;
  getCacheDateItem(): IterableIterator<Readonly<ChartDataItem<T>>>;
  /** 获取缓存中的数据 */
  getCacheData(): IterableIterator<T>;
  /** 更新图表数据。并将数据推入缓存 */
  updateData(data: T, timeName?: string): void;
  /** 维度信息 */
  readonly dimensions: ArrayLike<DimensionInfo>;
  /** 维度数量 */
  readonly dimension: number;
  readonly id: number;
  readonly meta: VioChartMeta;
}

/**
 * VioChart 创建配置
 * @public
 * @category Chart
 */
export type VioChartCreateConfig<T = unknown> = ChartCreateOption & {
  /** {@inheritdoc VioChart.id} */
  id: number;
  /** {@inheritdoc VioChart.dimension} */
  dimension: number;
  /** {@inheritdoc VioChart.onRequestUpdate} */
  onRequestUpdate?(): MaybePromise<T>;
  /** {@inheritdoc VioChart.updateThrottle} */
  updateThrottle?: number;
};
/**
 * VioChart 创建可选项
 * @public
 * @category Chart
 */
export type ChartCreateOption = {
  /** {@inheritdoc VioChart.meta} */
  meta?: VioChartMeta;
  /** {@inheritdoc VioChart.dimensions} */
  dimensions?: Record<number, DimensionInfo | undefined>;
  /** {@inheritdoc VioChart.maxCacheSize} */
  maxCacheSize?: number;
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
