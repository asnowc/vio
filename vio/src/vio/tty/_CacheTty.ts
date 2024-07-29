import { LinkedCacheQueue } from "evlib/data_struct";
import { TtyOutputsData } from "./tty.dto.ts";
import { TTY } from "./_TTY.ts";

type WriteTty = (ttyId: number, data: TtyOutputsData) => void;
export abstract class CacheTty extends TTY {
  constructor(
    readonly ttyIndex: number,
    cacheSize: number,
    writeTty?: WriteTty,
  ) {
    super();
    this.#writeTty = writeTty;
    this.#outputCache = new LinkedCacheQueue(cacheSize);
  }
  #writeTty?: WriteTty;
  #outputCache: LinkedCacheQueue<{ data: TtyOutputsData }>;
  get cachedSize() {
    return this.#outputCache.size;
  }
  get cacheSize() {
    return this.#outputCache.maxSize;
  }
  set cacheSize(size: number) {
    this.#outputCache.maxSize = size;
  }
  *getCache(): Generator<TtyOutputsData, void, void> {
    for (const item of this.#outputCache) {
      yield item.data;
    }
  }

  /** @implements */
  write(data: TtyOutputsData): void {
    this.#outputCache.push({ data });
    if (!this.#writeTty) return;
    this.#writeTty(this.ttyIndex, data);
  }
  get disposed() {
    return !this.#writeTty;
  }
  dispose() {
    // dispose 后保留 cache
    this.#writeTty = undefined;
  }
}
