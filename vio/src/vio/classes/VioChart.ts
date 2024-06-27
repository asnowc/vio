import type { DimensionalityReduction, IntersectingDimension, VioChartMeta } from "../api_type.ts";
import { LinkedCacheQueue } from "evlib/data_struct";
import { deepClone } from "evlib";
import { IndexRecord, indexRecordToArray } from "../../lib/array_like.ts";

/** VIO VioChart
 * @public
 */
export class VioChart<T = number> {
  constructor(config: VioChartCreateConfig) {
    const { dimensionIndexNames = {}, dimension, maxCacheSize = 0, meta } = config;
    this.#cache = new LinkedCacheQueue<{ data: T; name?: string; time: number }>(maxCacheSize);
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
  #cache;
  get cachedSize() {
    return this.#cache.size;
  }
  get data() {
    return this.lastData?.data;
  }
  get lastData() {
    return this.#cache.last;
  }
  get headData() {
    return this.#cache.head;
  }
  *getCacheData(): Generator<T, void, void> {
    for (const item of this.#cache) {
      yield item.data;
    }
  }
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
  get maxCacheSize(): number {
    return this.#cache.maxSize;
  }
  set maxCacheSize(size: number) {
    this.#cache.maxSize = size;
  }
  eachTimeline() {
    return this.#cache[Symbol.iterator]();
  }
  readonly dimensionIndexNames: Readonly<Record<number, (string | undefined)[] | undefined>>;
  get cacheData(): T[] {
    return Array.from(this.getCacheData());
  }
  readonly dimension: number;
  readonly id: number;
  readonly meta: VioChartMeta;
}
/** @public */
export type VioChartCreateConfig = {
  id: number;
  dimension: number;
  meta?: VioChartMeta;
  /** 维度刻度名称 */
  dimensionIndexNames?: Record<number, ArrayLike<string | undefined> | undefined>;
  maxCacheSize?: number;
};
/** @public */
export type VioChartUpdateOpts = {
  /** 与坐标对应 */
  dimensionIndexNames?: Record<number, ArrayLike<string | undefined> | null>;
  /** 时间轴刻度名称 */
  timeName?: string;
};
/** @public */
export type VioChartUpdateLowerOpts = {
  dimensionIndexNames?: string;
  timeName?: string;
};
