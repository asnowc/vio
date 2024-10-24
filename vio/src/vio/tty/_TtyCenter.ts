import type { ClientTtyExposed, ServerTtyExposed, TtyInputsReq, TtyOutputsData } from "../api_type.ts";
import { UniqueKeyMap } from "evlib/data_struct";
import { CacheTty } from "./_CacheTty.ts";
import { InstanceDisposedError } from "../const.ts";
import { RpcExposed, RpcService } from "cpcall";
import { TtyCenter, VioTty } from "./type.ts";

@RpcService()
export class TtyCenterImpl implements TtyCenter, ServerTtyExposed {
  constructor(clientTtyApi: ClientTtyExposed) {
    this.#clientApi = clientTtyApi;
  }
  #clientApi: ClientTtyExposed;
  #instanceMap = new Map<number, VioTtyImpl>();
  defaultCacheSize = 20;
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
    const tty = new VioTtyImpl(index, this.defaultCacheSize, this.#clientApi);
    this.#instanceMap.set(index, tty);
    return tty;
  }
  getCreated(index: number): VioTty | undefined {
    return this.#instanceMap.get(index);
  }
  /** 获取所有已创建的 TTY */
  getAll(): IterableIterator<VioTty> {
    return this.#instanceMap.values();
  }

  /** 删除指定索引的 TTY */
  delete(tty: VioTty): boolean {
    if (!(tty instanceof VioTtyImpl)) return false;
    if (this.#instanceMap.get(tty.ttyIndex) === tty) {
      tty.dispose();
      return this.#instanceMap.delete(tty.ttyIndex);
    }
    return false;
  }
  *eachWaitingReadRequest(): Generator<
    { ttyId: number; requestId: number; config: TtyInputsReq },
    undefined,
    undefined
  > {
    for (const tty of this.#instanceMap.values()) {
      tty.ttyIndex;
      for (const [id, hd] of tty.waitingResolverMap) {
        yield { ttyId: tty.ttyIndex, requestId: id, config: hd.config };
      }
    }
  }
  // ServerTtyExposed 实现

  @RpcExposed()
  getTtyCache(id: number): TtyOutputsData[] {
    const tty = this.getCreated(id);
    if (!tty) return [];
    return Array.from(tty.getCache());
  }
  @RpcExposed()
  resolveTtyReadRequest(ttyId: number, requestId: number, res: any): boolean {
    const tty = this.#instanceMap.get(ttyId);
    if (!tty) return false;
    return tty.resolveRequest(requestId, res);
  }
  @RpcExposed()
  rejectTtyReadRequest(ttyId: number, requestId: number, reason: any): boolean {
    const tty = this.#instanceMap.get(ttyId);
    if (!tty) return false;
    return tty.rejectRequest(requestId, reason);
  }
  @RpcExposed()
  inputTty(ttyId: number, data: any): boolean {
    const tty = this.#instanceMap.get(ttyId);
    if (!tty) return false;
    return tty.input(data);
  }
}

class VioTtyImpl extends CacheTty implements VioTty {
  constructor(ttyIndex: number, cacheSize: number, clientApi: ClientTtyExposed) {
    super(ttyIndex, cacheSize, clientApi.writeTty.bind(clientApi));
    this.#clientApi = clientApi;
  }
  #clientApi: ClientTtyExposed;
  read<T = unknown>(config: TtyInputsReq): Promise<T>;
  /** @implements */
  read(config: TtyInputsReq): Promise<unknown> {
    if (this.disposed) return Promise.reject(new InstanceDisposedError("VioTty"));
    return new Promise((resolve, reject) => {
      const id = this.waitingResolverMap.allocKeySet({ resolve, reject, config });
      try {
        this.#clientApi.sendTtyReadRequest(this.ttyIndex, id, config);
      } catch (error) {
        reject(error);
        this.waitingResolverMap.delete(id);
      }
    });
  }
  /** @override */
  dispose() {
    super.dispose();
    const err = new InstanceDisposedError("VioTty");
    for (const hd of this.waitingResolverMap.values()) {
      hd.reject(err);
    }
    this.waitingResolverMap.clear();
  }
  /** 等待解决的请求 */
  readonly waitingResolverMap = new UniqueKeyMap<{
    resolve(data: any): void;
    reject(reason?: any): void;
    config: TtyInputsReq;
  }>(0xffff_ffff);
  resolveRequest(id: number, data: any) {
    const hd = this.waitingResolverMap.take(id);
    if (hd) {
      hd.resolve(data);
      return true;
    }
    return false;
  }
  rejectRequest(id: number, reason: any) {
    const hd = this.waitingResolverMap.take(id);
    if (hd) {
      hd.reject(reason);
      return true;
    }
    return false;
  }
  input(data: any): boolean {
    // TODO: 方案待定
    return false;
  }
}
