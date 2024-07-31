import type { TtyInputsReq, TtyOutputsData, VioClientExposed } from "../api_type.ts";
import { LinkedQueue, UniqueKeyMap } from "evlib/data_struct";
import { TTY } from "./_TTY.ts";
import { withPromise, WithPromise } from "evlib";
import { CacheTty } from "./_CacheTty.ts";
import { InstanceDisposedError } from "../const.ts";

type TtyWriterFn = (ttyId: number, data: TtyOutputsData) => void;
type TtyReadFn = VioClientExposed["tty"]["sendTtyReadRequest"];

/**
 * @public
 * @category TTY
 */
export class TtyCenter {
  static TTY_DEFAULT_CACHE_SIZE = 20;
  constructor(private writeTty: TtyWriterFn) {}

  #instanceMap = new Map<number, VioTtyImpl>();

  /** 获取指定索引的 TTY. 如果不存在，则创建后返回 */
  get(ttyId: number): VioTty {
    let tty: VioTty | undefined = this.#instanceMap.get(ttyId);
    if (!tty) {
      tty = this.#create(ttyId);
    }
    return tty;
  }
  #create(index: number): VioTty {
    if (index < 0) throw new Error("index can't less than 0");
    const tty = new VioTtyImpl(index, TtyCenter.TTY_DEFAULT_CACHE_SIZE, this.#resolver, this.writeTty);
    this.#instanceMap.set(index, tty);
    const resolver = this.#resolver[index];
    if (resolver) {
      resolver.transferInputPermissions(tty);
    }
    return tty;
  }
  getCreated(index: number): VioTty | undefined {
    return this.#instanceMap.get(index);
  }
  /** 获取所有已创建的 TTY */
  getAll(): IterableIterator<VioTty> {
    return this.#instanceMap.values();
  }
  /** 设置 TTY 的读取器。当 web端开启 “接收输入请求” 时，相当于调用了这个方法。 */
  setReader(ttyId: number, reader: TtyReader): TtyReadResolver {
    const resolver = new InternalReadResolver(reader, ttyId, this.#resolver);
    const oldResolver = this.#resolver[ttyId];
    this.#resolver[ttyId] = resolver;
    if (oldResolver)
      oldResolver.dispose(); // 销毁， 转移读取请求
    else {
      const tty = this.#instanceMap.get(ttyId);
      if (tty) {
        resolver.transferInputPermissions(tty);
      }
    }

    return resolver;
  }

  #resolver: Record<number, InternalReadResolver> = {};
  /** 删除指定索引的 TTY */
  delete(tty: VioTty): boolean {
    if (!(tty instanceof VioTtyImpl)) return false;
    if (this.#instanceMap.get(tty.ttyIndex) === tty) {
      tty.dispose();
      return this.#instanceMap.delete(tty.ttyIndex);
    }
    return false;
  }
}

class VioTtyImpl extends CacheTty implements VioTty {
  constructor(
    ttyIndex: number,
    cacheSize: number,
    resolvers: Record<number, InternalReadResolver>,
    writeTty?: TtyWriterFn,
  ) {
    super(ttyIndex, cacheSize, writeTty);
    this.#resolvers = resolvers;
  }
  read<T = unknown>(config: TtyInputsReq): Promise<T>;
  /** @implements */
  read(config: TtyInputsReq): Promise<unknown> {
    if (this.disposed) return Promise.reject(new InstanceDisposedError("VioTty"));
    const resolver = this.#resolvers[this.ttyIndex];
    if (resolver) {
      return resolver.read(config);
    } else {
      const hd = withPromise({ config: { ...config } });
      this.#waitingSendQueue.push(hd);
      return hd.promise;
    }
  }
  /** @override */
  dispose() {
    super.dispose();
    const err = new InstanceDisposedError("VioTty");
    for (const reading of this.#waitingSendQueue) {
      reading.reject(err);
    }
    this.#waitingSendQueue.clear();
    const resolver = this.#resolvers[this.ttyIndex];
    if (resolver) {
      resolver.ttyOnDispose();
    }
  }
  #resolvers: Record<number, InternalReadResolver>;
  /** 等待发送的读取请求队列 */
  #waitingSendQueue = new LinkedQueue<ReadingHandle>();
  #input(data: any): boolean {
    // TODO: 方案待定
    return false;
  }

  static TtyReadResolver = class InternalReadResolver implements TtyReadResolver {
    constructor(reader: TtyReader, ttyId: number, resolvers: Record<number, InternalReadResolver>) {
      this.#reader = reader;
      this.#ttyId = ttyId;
      this.#resolvers = resolvers;
    }
    readonly #resolvers: Record<number, InternalReadResolver>;
    readonly #reader: TtyReader;
    readonly #ttyId: number;
    #tty?: VioTtyImpl;

    /** 等待解决的请求 */
    #waitingResolverMap = new UniqueKeyMap<ReadingHandle>(0xffff_ffff);
    get waitingSize() {
      return this.#waitingResolverMap.size;
    }
    input(data: any): boolean {
      if (!this.#tty) return false;
      return this.#tty.#input(data);
    }
    resolve(requestId: number, data: any): boolean {
      const hd = this.#waitingResolverMap.take(requestId);
      if (!hd) return false;
      hd.resolve(data);
      return true;
    }
    reject(requestId: number, reason: any): boolean {
      const hd = this.#waitingResolverMap.take(requestId);
      if (!hd) return false;
      hd.reject(reason);
      return true;
    }
    #rejectAll(reason: Error) {
      for (const item of this.#waitingResolverMap.values()) {
        item.reject(reason);
      }
      this.#waitingResolverMap.clear();
    }
    read(config: TtyInputsReq): Promise<unknown> {
      let hd: ReadingHandle = withPromise({ config: { ...config } });
      const requestId = this.#waitingResolverMap.allocKeySet(hd);
      this.#reader.read(this.#ttyId, requestId, config);
      return hd.promise;
    }

    /** 将 tty 输入权转移到当前 resolver */
    transferInputPermissions(tty: VioTtyImpl) {
      const reader = this.#reader;
      if (!reader) return Promise.reject(new InstanceDisposedError("ReadResolver"));

      this.#tty = tty;

      //处理终端实例中未发送的数据
      const sendQueue: LinkedQueue<ReadingHandle> = tty.#waitingSendQueue;
      for (const handle of sendQueue) {
        const requestId = this.#waitingResolverMap.allocKeySet(handle);
        reader.read(tty.ttyIndex, requestId, handle.config);
      }
      sendQueue.clear();
    }
    /** 转移 resolver 上未解决的请求到当前 实例 */
    transferInputPermissionsFromResolver(resolver: this, tty: VioTtyImpl) {
      //转移未解决的请求到对应 tty 的 resolver 上
      const reader = this.#reader;
      for (const hd of resolver.#waitingResolverMap.values()) {
        const requestId = this.#waitingResolverMap.allocKeySet(hd);
        reader.read(this.#ttyId, requestId, hd.config);
      }
      resolver.#waitingResolverMap.clear();
      this.#tty = tty;
    }
    ttyOnDispose() {
      this.#tty = undefined;
    }

    /** 关闭读取权*/
    disable() {
      if (this.#enablePromise) {
        this.#enablePromise.resolve();
        this.#enablePromise = undefined;
      }
      if (this.#resolvers[this.#ttyId] === this) delete this.#resolvers[this.#ttyId];
    }
    #enablePromise?: WithPromise<void>;
    /** 开启读取权 */
    enable(): Promise<void> {
      if (this.#enablePromise) return this.#enablePromise.promise;

      const oldResolver = this.#resolvers[this.#ttyId];
      if (oldResolver) {
        oldResolver.disable();
      }
      this.#resolvers[this.#ttyId] = this;
      this.#enablePromise = withPromise();
      return this.#enablePromise.promise;
    }
    /** 销毁 Resolver，并将未解决的请求转移 */
    dispose() {
      this.disable();
      const tty = this.#tty;
      this.#tty = undefined;
      if (tty) {
        const resolver = this.#resolvers[this.#ttyId];
        if (resolver) {
          resolver.transferInputPermissionsFromResolver(this, tty);
        } else if (!tty.disposed) {
          //转移未解决的请求到对应的 tty 上
          const queue = tty.#waitingSendQueue;
          for (const item of this.#waitingResolverMap.values()) {
            queue.push(item);
          }
          this.#waitingResolverMap.clear();
        }
      }
      if (this.#waitingResolverMap.size) {
        this.#rejectAll(new Error("Internal error: TtyReadResolver and TTY has been disposed"));
      }
      this.#reader.dispose?.();
    }
  };
}

const InternalReadResolver = VioTtyImpl.TtyReadResolver;
type InternalReadResolver = InstanceType<typeof VioTtyImpl.TtyReadResolver>;

type ReadingHandle = WithPromise<unknown> & { config: TtyInputsReq };

/**
 * @public
 * @category TTY
 */
export interface VioTty extends TTY {
  /** 已缓存的消息数量 */
  cachedSize: number;
  /** 缓存数量上限。可修改 */
  cacheSize: number;
  /** 获取已缓存是数据 */
  getCache(): IterableIterator<TtyOutputsData>;
  /** TTY 是否已被销毁 */
  disposed: boolean;
}
/**
 * @public
 * @category TTY
 */
export interface TtyReader {
  /** 当 读取时调用 */
  read: TtyReadFn;
  /** 当读取权被夺走时嗲用 */
  dispose?(): void;
}
/**
 * @public
 * @category TTY
 */
export interface TtyReadResolver {
  /** 取消设置 TTY 的读取器 */
  dispose(): void;
  // disable(): void;
  /** 解决读取 */
  resolve(requestId: number, data: any): boolean;
  /** 拒绝读取 */
  reject(requestId: number, reason: any): boolean;
  /** 主动输入。 */
  input(data: any): boolean;
  /** 读取中的数量 */
  waitingSize: number;
}
