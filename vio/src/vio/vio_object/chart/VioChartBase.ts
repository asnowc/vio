import type {
  ChartDataItem,
  ChartUpdateLowerOption,
  DimensionInfo,
  DimensionalityReduction,
  IntersectingDimension,
  RequestUpdateRes,
  VioChart,
  VioChartCreateConfig,
  VioChartMeta,
} from "./chart.type.ts";
import { LinkedCacheQueue } from "evlib/data_struct";
import { deepClone } from "evlib";
import { IndexRecord } from "../../../lib/array_like.ts";
import { MaybePromise } from "../../../type.ts";

export abstract class VioChartBase<T = number> implements VioChart<T> {
  constructor(config: VioChartCreateConfig<T>) {
    const { dimensions, dimension, maxCacheSize = 0, meta, onRequestUpdate, updateThrottle = 0 } = config;
    if (!(dimension >= 0)) throw new RangeError("dimension must be a positive integer");
    this.#cache = new LinkedCacheQueue<ChartDataItem<T>>(maxCacheSize);
    this.dimension = dimension;
    this.id = config.id;
    this.name = config.name;

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
    this.#onRequestUpdate = onRequestUpdate;
  }
  readonly type = "chart";

  updateThrottle: number;
  /** 主动请求更新的回调函数 */
  #onRequestUpdate?: () => MaybePromise<T>;
  name?: string;
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

  #lastData?: MaybePromise<RequestUpdateRes<T>>;
  requestUpdate(): MaybePromise<RequestUpdateRes<T>> {
    if (!this.#onRequestUpdate) throw new Error("Requests for updates are not allowed");
    const timestamp = Date.now();

    if (this.#lastData) {
      if (this.#lastData instanceof Promise) return this.#lastData;
      if (timestamp - this.#lastData.timestamp <= this.updateThrottle) return this.#lastData;
    }

    const value = this.#onRequestUpdate();
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
}
