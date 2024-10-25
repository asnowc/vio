import type {
  ClientTtyExposed,
  GetTtyCommandsOption,
  ServerTtyExposed,
  TtyCommandInfo,
  TtyInputsReq,
  TtyOutputsData,
} from "./tty.dto.ts";
import { UniqueKeyMap } from "evlib/data_struct";
import { CacheTty } from "./_CacheTty.ts";
import { InstanceDisposedError } from "../const.ts";
import { RpcExposed, RpcService } from "cpcall";
import { TtyCenter, TtyCommand, VioTty } from "./type.ts";
import { Viewer } from "../_rpc_api.ts";
import { MaybePromise } from "../../type.ts";

export class TtyCenterImpl implements TtyCenter {
  constructor(clientTtyApi: ClientTtyExposed) {
    this.#clientApi = clientTtyApi;
  }
  #clientApi: ClientTtyExposed;
  #instanceMap = new Map<number, VioTtyImpl>();
  defaultCacheSize = 20;
  /** 获取指定索引的 TTY. 如果不存在，则创建后返回 */
  get(ttyId: number): VioTtyImpl {
    let tty: VioTtyImpl | undefined = this.#instanceMap.get(ttyId);
    if (!tty) {
      tty = this.#create(ttyId);
    }
    return tty;
  }
  #create(index: number): VioTtyImpl {
    if (index < 0) throw new Error("index can't less than 0");
    const tty = new VioTtyImpl(index, this.defaultCacheSize, this.#clientApi);
    this.#instanceMap.set(index, tty);
    return tty;
  }
  getCreated(ttyId: number): VioTtyImpl | undefined {
    return this.#instanceMap.get(ttyId);
  }
  /** 获取所有已创建的 TTY */
  getAll(): IterableIterator<VioTtyImpl> {
    return this.#instanceMap.values();
  }

  /** 删除指定索引的 TTY */
  delete(tty: VioTtyImpl): boolean {
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
  /** 设置指定 TTY 的命令，如果call 为 undefined，则删除命令 */
  setCommand(command: string, call?: TtyCommand, ttyId: number = 0): void {
    if (call) {
      this.get(ttyId).setCommand(command, call);
    } else {
      this.getCreated(ttyId)?.setCommand(command, call);
    }
  }
}

@RpcService()
export class ServerTtyExposedImpl implements ServerTtyExposed {
  constructor(
    private ttyCenter: TtyCenterImpl,
    private viewer: Viewer,
    private viewers: Set<Viewer>,
  ) {}
  private getTty(ttyId: number): VioTtyImpl | undefined {
    const tty = this.ttyCenter.getCreated(ttyId);
    if (tty instanceof VioTtyImpl) return tty;
  }

  /** @override */
  @RpcExposed()
  getTtyCache(id: number): TtyOutputsData[] {
    const { ttyCenter } = this;
    const tty = ttyCenter.getCreated(id);
    if (!tty) return [];
    return Array.from(tty.getCache());
  }
  /** @override */
  @RpcExposed()
  resolveTtyReadRequest(ttyId: number, requestId: number, res: any): boolean {
    const tty = this.getTty(ttyId);
    if (!tty) return false;
    for (const viewer of this.viewers) {
      if (viewer === this.viewer) continue; // 解决读取请求的客户端不用发送取消读取请求
      viewer.tty.cancelTtyReadRequest(ttyId, requestId);
    }
    return tty.resolveRequest(requestId, res);
  }
  /** @override */
  @RpcExposed()
  rejectTtyReadRequest(ttyId: number, requestId: number, reason: any): boolean {
    const tty = this.getTty(ttyId);
    if (!tty) return false;
    return tty.rejectRequest(requestId, reason);
  }
  /** @override */
  @RpcExposed()
  inputTty(ttyId: number, data: any): boolean {
    const tty = this.getTty(ttyId);
    if (!tty) return false;
    return tty.input(data);
  }
  /** @override */
  @RpcExposed()
  execCommand(ttyId: number, command: string, args = {}): any {
    const tty = this.getTty(ttyId);
    if (!tty) throw new Error(`命令 ${command} 在终端${ttyId}未注册`);
    const config = tty.getCommand(command);
    if (!config) throw new Error(`命令 ${command} 在终端${ttyId}未注册`);
    //todo 校验 args
    return config.call(args, { command });
  }
  /** @override */
  @RpcExposed()
  getTtyCommands(options: GetTtyCommandsOption = {}): MaybePromise<{ list: TtyCommandInfo[] }> {
    const { page = 10, pageSize = 20, ttyId } = options;
    const search = options.search?.toLocaleLowerCase();
    const list: TtyCommandInfo[] = [];
    const result: { list: TtyCommandInfo[] } = { list };
    if (page <= 0 || isNaN(page)) return result;
    let eachTty: Iterable<VioTtyImpl>;
    if (ttyId) {
      const tty = this.ttyCenter.getCreated(ttyId);
      if (!tty) return result;
      eachTty = [tty];
    } else {
      eachTty = this.ttyCenter.getAll();
    }
    for (const tty of eachTty) {
      let item: TtyCommandInfo | undefined;
      for (const [id, command] of tty.eachCommands()) {
        item = { ttyId: tty.ttyIndex, description: command.description, args: command.args, command: id };
        if (search) {
          const isMatch =
            id.toLocaleLowerCase().includes(search) || command.description?.toLocaleLowerCase().includes(search);
          if (isMatch) list.push(item);
        } else list.push(item);
        if (list.length === pageSize) return result;
      }
    }
    return result;
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

  #commands = new Map<string, TtyCommand>();
  /** @override */
  setCommand(command: string, call?: TtyCommand) {
    if (call) this.#commands.set(command, call);
    else this.#commands.delete(command);
  }
  eachCommands() {
    return this.#commands.entries();
  }
  getCommand(command: string) {
    return this.#commands.get(command);
  }
}
