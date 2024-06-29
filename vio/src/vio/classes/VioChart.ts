import type { DimensionalityReduction, IntersectingDimension, VioChartMeta } from "../api_type.ts";
import { LinkedCacheQueue } from "evlib/data_struct";
import { deepClone } from "evlib";
import { IndexRecord, indexRecordToArray } from "../../lib/array_like.ts";
/**
 * VIO Chart
 * @public
 * @category Chart
 */
export class VioChart<T = number> {
  constructor(config: VioChartCreateConfig) {
    const { dimensionIndexNames = {}, dimension, maxCacheSize = 0, meta } = config;
    this.#cache = new LinkedCacheQueue<ChartDataItem<T>>(maxCacheSize);
    this.dimension = dimension;
    this.id = config.id;

    const finalDimensionIndexNames: IndexRecord<(string | undefined)[]> = { length: dimension };

    for (let i = 0; i < dimension; i++) {
      const indexNames = dimensionIndexNames[i];
      if (indexNames) finalDimensionIndexNames[i] = indexRecordToArray(indexNames, indexNames.length);
      else finalDimensionIndexNames[i] = [];
    }
    Object.freeze(finalDimensionIndexNames);
    this.dimensionIndexNames = finalDimensionIndexNames;
    this.meta = { ...meta };
  }
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
  get lastDataItem(): Readonly<ChartDataItem<T>> | undefined {
    return this.#cache.last;
  }
  get headDataItem(): Readonly<ChartDataItem<T>> | undefined {
    return this.#cache.head;
  }
  /** @deprecated 改用 headDataItem */
  get headData(): Readonly<ChartDataItem<T>> | undefined {
    return this.#cache.head;
  }
  /** 遍历时间维度上的数据 */
  private eachTimeline(): Generator<Readonly<ChartDataItem<T>>, void, void> {
    return this.#cache[Symbol.iterator]();
  }
  /** 获取缓存中的数据 */
  *getCacheData(): Generator<T, void, void> {
    for (const item of this.#cache) {
      yield item.data;
    }
  }
  /** 更新图表数据。并将数据推入缓存 */
  updateData(data: T, timeAxisName?: string): void {
    this.#cache.push({ data, time: Date.now(), name: timeAxisName });
  }

  private updateLowerOneDimension(updateData: IntersectingDimension<T>, coord: number, coordName?: string) {
    const current = this.data!;
    if (!current) throw new Error("Data no exist");
    if (!(current instanceof Array)) throw new Error("Unable to update data for dimension 0");

    let data = new Array(current.length);

    for (let i = 0; i < data.length; i++) {
      if (i === coord) data[i] = updateData;
      else data[i] = typeof current[i] === "object" ? deepClone(current[i]) : current[i];
    }
    this.updateData(data as T);
    if (coordName !== undefined) {
      let axis = this.dimensionIndexNames[0]!;
      //@ts-ignore
      axis[coord] = coordName;
    }
  }
  /** 降一个维度更新数据 */
  updateSubData(updateData: DimensionalityReduction<T>, coord: number, opts?: VioChartUpdateLowerOpts): void;
  // updateSubData(updateData: IntersectingDimension<T>, coord: (number | undefined)[], opts?: UpdateSubDataOpts): void;
  updateSubData(
    updateData: IntersectingDimension<T>,
    coord: (number | undefined)[] | number,
    opts: VioChartUpdateLowerOpts | VioChartUpdateOpts = {},
  ): void {
    const { dimensionIndexNames } = opts;
    if (typeof coord === "number") {
      return this.updateLowerOneDimension(updateData, coord, dimensionIndexNames as string);
    }
    //TODO: 实现更细维度的数据更新
    throw new Error("未实现");
    // this.updateData(data);
  }
  /** 维度刻度名称 */
  readonly dimensionIndexNames: Readonly<Record<number, (string | undefined)[] | undefined>>;

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
export type VioChartCreateConfig = VioChartCreateOpts & {
  id: number;
  dimension: number;
};
/**
 * VioChart 创建可选项
 * @public
 * @category Chart
 */
export type VioChartCreateOpts = {
  /** {@inheritdoc VioChart.meta} */
  meta?: VioChartMeta;
  /** {@inheritdoc VioChart.dimensionIndexNames} */
  dimensionIndexNames?: Record<number, ArrayLike<string | undefined> | undefined>;
  /** {@inheritdoc VioChart.maxCacheSize} */
  maxCacheSize?: number;
};
/**
 * @public
 * @category Chart
 */
export type VioChartUpdateOpts = {
  /** {@inheritdoc VioChart.dimensionIndexNames} */
  dimensionIndexNames?: Record<number, ArrayLike<string | undefined> | null>;
  /** 时间轴刻度名称 */
  timeName?: string;
};
/**
 * @public
 * @category Chart
 */
export type VioChartUpdateLowerOpts = {
  dimensionIndexNames?: string;
  /** {@inheritdoc VioChartUpdateOpts.timeName} */
  timeName?: string;
};
/**
 * @public
 * @category Chart
 */
export interface ChartDataItem<T = number> {
  data: T;
  name?: string;
  time: number;
}
