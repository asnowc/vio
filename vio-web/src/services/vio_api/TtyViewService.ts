import { ClientTtyExposed, ServerTtyExposed, TtyInputsReq, TtyOutputData, TtyOutputsData } from "@asla/vio/client";
import { RpcExposed, RpcService, MakeCallers } from "cpcall";
import { EventTrigger } from "evlib";
import { LinkedCacheQueue, LinkedQueue, LoopUniqueId } from "evlib/data_struct";

@RpcService()
export class TtyViewService implements ClientTtyExposed {
  /** 输出队列消息增加或减少时触发 */
  readonly outputChangeEvent = new EventTrigger<{ id: number }>();
  /** 输入队列的请求项增加或减少时触发  */
  readonly readingChangeEvent = new EventTrigger<{ id: number }>();
  /** TTY 被创建 */
  readonly createEvent = new EventTrigger<number>();

  createTty(index: number): TtyClientAgent {
    let tty = this.#ttys[index];
    if (tty) throw new Error(`TTY 索引${index} 已存在`);
    else {
      tty = new TtyClientAgent(index, this);
      this.#ttys[index] = tty;
    }
    this.createEvent.emit(index);
    return tty;
  }
  get(index: number, create: true): TtyClientAgent;
  get(index: number, create?: boolean): TtyClientAgent | undefined;
  get(index: number, create?: boolean) {
    let tty = this.#ttys[index];
    if (!tty && create) {
      tty = new TtyClientAgent(index, this);
      this.#ttys[index] = tty;
    }
    return tty;
  }
  deleteTty(index: number) {
    delete this.#ttys[index];
  }
  getAll(): Iterable<TtyClientAgent> {
    return Object.values(this.#ttys) as TtyClientAgent[];
  }
  private clearAllReading() {
    for (const tty of Object.values(this.#ttys)) {
      tty.clearReading();
    }
  }
  init(resolver?: MakeCallers<ServerTtyExposed>) {
    this.clearAllReading();
    this.serverApi = resolver;
  }
  serverApi?: MakeCallers<ServerTtyExposed>;
  #ttys: Record<number, TtyClientAgent> = {};

  @RpcExposed()
  sendTtyReadRequest(ttyId: number, requestId: number, opts: TtyInputsReq): void {
    return this.get(ttyId, true).addReading(requestId, opts);
  }
  @RpcExposed()
  cancelTtyReadRequest(ttyId: number, requestId: number): void {
    this.get(ttyId)?.deleteReading(requestId);
  }
  @RpcExposed()
  writeTty(ttyId: number, data: TtyOutputsData): void {
    this.get(ttyId, true).addOutput(data);
  }
}

export class TtyClientAgent {
  constructor(
    readonly ttyId: number,
    private center: TtyViewService,
  ) {}
  forEachOutput() {
    return this.#record[Symbol.iterator]();
  }
  get outputCacheSize() {
    return this.#record.size;
  }
  /** 终端输出的缓存数据 */
  readonly #record: LinkedQueue<TtyOutputMsg> = new LinkedCacheQueue<TtyOutputMsg>(999);
  /** 当收到服务端消息时被调用 */
  addOutput(data: TtyOutputsData) {
    const msgLink = this.#record;
    msgLink.push({ type: "output", msg: transformTtyOutputData(data), date: Date.now(), key: this.#msgId.next() });
    this.center.outputChangeEvent.emit({ id: this.ttyId });
  }
  setCacheData(list: TtyOutputsData[]) {
    const msgLink = this.#record;
    for (const data of list) {
      msgLink.unshift({ type: "output", msg: transformTtyOutputData(data), date: Date.now(), key: this.#msgId.next() });
    }
    this.center.outputChangeEvent.emit({ id: this.ttyId });
  }
  #msgId = new LoopUniqueId();
  /** 清空输出缓存数据 */
  clearOutputCache() {
    this.#record.clear();
    this.center.outputChangeEvent.emit({ id: this.ttyId });
    this.#msgId.reset();
  }

  clearReading(reason: Error = new Error("读取被清除"), send?: boolean) {
    const resolver = this.#resolver;
    if (resolver && send) {
      for (const item of this.readingMap.values()) {
        resolver.rejectTtyReadRequest(this.ttyId, item.key, reason);
      }
    }
    this.readingMap.clear();
    this.center.readingChangeEvent.emit({ id: this.ttyId });
  }
  get #resolver() {
    return this.center.serverApi;
  }
  /** 终端读取中的请求 */
  private readonly readingMap = new Map<number, TtyInputMsg>();
  get readingSize() {
    return this.readingMap.size;
  }
  async resolveReading(requestId: number, value: any, reserve?: boolean): Promise<boolean> {
    const item = this.readingMap.get(requestId);
    if (!item) throw new Error(`Request id '${requestId}' does not exist`);
    const resolver = this.#resolver;
    if (resolver) {
      item.status = InputRequestStatus.resolving;
      this.center.readingChangeEvent.emit({ id: this.ttyId });
    } else {
      item.status = InputRequestStatus.ignored;
      this.center.readingChangeEvent.emit({ id: this.ttyId });
      return false;
    }

    const success = await resolver.resolveTtyReadRequest(this.ttyId, requestId, value);
    item.status = InputRequestStatus.resolved;
    if (!reserve) this.readingMap.delete(requestId);
    this.center.readingChangeEvent.emit({ id: this.ttyId });
    return success;
  }

  /** 删除客户端上指定的读取请求。  */
  deleteReading(requestId: number, reason?: any) {
    const item = this.readingMap.get(requestId);
    if (!item) throw new Error(`Request id '${requestId}' does not exist`);
    this.readingMap.delete(requestId);
    this.center.readingChangeEvent.emit({ id: this.ttyId });
    return item;
  }
  /** 添加一个读取请求到队列中 */
  addReading(requestId: number, request: TtyInputsReq) {
    const hd: TtyInputMsg = {
      req: request,
      date: Date.now(),
      key: requestId,
      status: InputRequestStatus.waitingInput,
    };
    this.readingMap.set(requestId, hd);

    this.center.readingChangeEvent.emit({ id: this.ttyId });
  }
  forEachReading(): IterableIterator<Readonly<TtyInputMsg>> {
    return this.readingMap.values();
  }
}
function transformTtyOutputData(data: TtyOutputsData): TtyOutputsViewData {
  if (data.type === "image") {
    switch (data.imageDataType) {
      case 0: {
        const image = data.image;
        const bin = image.data;
        let buf: ArrayBuffer;
        if (bin.byteLength === bin.buffer.byteLength) {
          //@ts-ignore
          buf = bin.buffer;
        } else {
          const data = new Uint8Array(bin.byteLength);
          data.set(bin);
          //@ts-ignore
          buf = data.buffer;
        }
        return { data: new Blob([buf], { type: image.mime }), type: "image" };
      }
      case 1: {
        //TODO
      }
      default:
        return { data: new Blob(), type: "image" };
    }
  }
  return data;
}

export type TtyOutputMsg = { date: number; key: string | number } & {
  type?: "output";
  msg: TtyOutputsViewData;
};

export type TtyOutputsViewData =
  | TtyOutputData.Text
  | TtyOutputData.Table
  | TtyOutputImageViewData
  | TtyOutputData.UILink
  | TtyOutputData.Custom;
export type TtyOutputImageViewData = { type: "image"; data: Blob };

export type TtyInputMsg<T = TtyInputsReq> = {
  date: number;
  key: number;
  req: T;
  status: InputRequestStatus;
};
export enum InputRequestStatus {
  /** 发送已被忽略 */
  ignored = -3,
  /** 已拒绝 */
  rejected = -2,
  /** 拒绝中 */
  rejecting = -1,
  /** 等待输入 */
  waitingInput = 0,
  /** 输入中 */
  resolving = 1,
  /** 已输入 */
  resolved = 3,
}
