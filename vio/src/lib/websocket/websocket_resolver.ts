import type { Duplex } from "node:stream";
import { readableToByteReader, ByteReader } from "@eavid/lib-node/stream";
import { Buffer } from "node:buffer";
import { WithPromise, withPromise } from "evlib";

enum Opcode {
  continue = 0x0,
  text = 0x1,
  bin = 0x2,
  close = 0x8,
  ping = 0x9,
  pong = 0xa,
}
export interface WebSocketResolverOpts {
  onPing?(this: WebSocketResolverOpts): void;
  onMessage?(this: WebSocketResolverOpts, data: WebSocketData): void;
  onClose?(this: WebSocketResolverOpts): void;
  onError?(this: WebSocketResolverOpts, err: any): void;
  payloadLengthLimit?: number;
  /** payloadLength 超过这个值转为流 */
  toStreamThreshold?: number;
}
export class WebSocketResolver {
  constructor(
    private socket: Duplex,
    opts: WebSocketResolverOpts = {},
  ) {
    const voidFn = function () {};
    const {
      onPing = this.pong,
      onClose = voidFn,
      onError = voidFn,
      onMessage = voidFn,
      payloadLengthLimit = 2 ** 32,
      toStreamThreshold = 2 ** 32,
    } = opts;
    if (toStreamThreshold > 2 ** 32) throw new Error("payloadLengthLimit 不能超过 " + 2 ** 32);
    this.onPing = onPing;
    this.onClose = onClose;
    this.onError = onError;
    this.onMessage = onMessage;

    this.payloadLengthLimit = payloadLengthLimit;
    this.toStreamThreshold = toStreamThreshold;

    const { cancel, read } = readableToByteReader(this.socket);
    this.startRead(read)
      .finally(() => {
        this.finalClose();
        cancel();
      })
      .catch((err) => this.onError(err));
  }
  readonly payloadLengthLimit: number;
  readonly toStreamThreshold: number;
  private async startRead(read: ByteReader) {
    let frame: WsFrameHead | undefined;
    while ((frame = await this.readFrame(read))) {
      let content: Buffer;
      if (frame.payloadLength) {
        if (frame.payloadLength > this.payloadLengthLimit) {
          this.destroy(new Error("过长的帧"));
          return;
        } else if (frame.payloadLength > this.toStreamThreshold) {
          //todo: 转为流
          this.destroy(new Error("过长的帧"));
          return;
        } else content = Buffer.alloc(Number(frame.payloadLength));
        await read(content);
      } else content = Buffer.alloc(0);

      if (frame.useMask) encodeMsg(content, frame.maskKey!);

      switch (frame.opcode) {
        case Opcode.close:
          this.close();
          return;
        case Opcode.bin:
          this.onMessage(content);
          break;

        case Opcode.text:
          this.onMessage(content.toString("utf-8"));
          break;
        case Opcode.ping:
          this.onPing();
          break;
        case Opcode.pong: {
          const item = this.#pingWaitingQueue.shift();
          item?.resolve();
          break;
        }
        default:
          this.onError(new Error("unknown frame"));
          break;
      }
    }
  }
  private async readFrame(read: ByteReader) {
    const head = await read(Buffer.alloc(2)).catch(() => null);
    if (!head) return;
    const frame = decodeWsHead(head);
    switch (frame.firstLength) {
      case 0x7e: {
        let lenBuf = await read(Buffer.alloc(2));
        frame.payloadLength = BigInt(lenBuf.readUint16BE());
        break;
      }
      case 0x7f: {
        let lenBuf = await read(Buffer.alloc(8));
        frame.payloadLength = lenBuf.readBigUint64BE();
        break;
      }
      default:
        frame.payloadLength = BigInt(frame.firstLength);
        break;
    }
    if (frame.useMask) frame.maskKey = await read(4);
    return frame;
  }

  /**
   * @description 发送数据帧
   * @param data <Buffer|String>:要发送的数据
   * @param maskKey
   * @param hasSplit 是否还有继续帧
   * @return 此次否成功可以发送
   */
  send(data: WebSocketData, maskKey?: number, hasSplit?: boolean) {
    let opcode: Opcode; //二进制
    if (typeof data === "string") {
      opcode = Opcode.text;
      data = Buffer.from(data, "utf-8");
    } else if (data instanceof Uint8Array) {
      opcode = Opcode.bin;
    } else throw new UnsupportedDataType();

    const head = encodeWsHead(data.length, opcode, maskKey, hasSplit);
    this.sendFrame(head);
    if (typeof maskKey === "number") encodeMsg(data, head.subarray(head.length - 4), 0n);
    this.sendFrame(data);
    return true;
  }
  /**
   * 发送继续帧
   */
  sendSplit(data: WebSocketData, maskKey?: number, hasSplit?: boolean) {
    if (this.status !== WS_STATUS.OPEN) throw new WebSocketStatusError();
    if (typeof data === "string") {
      data = Buffer.from(data, "utf-8");
    } else if (!Buffer.isBuffer(data)) throw new UnsupportedDataType();

    const head = encodeWsHead(data.length, Opcode.continue, maskKey, hasSplit);
    this.socket.write(head);
    if (typeof maskKey === "number") encodeMsg(data, head.subarray(head.length - 4), 0n);
    this.socket.write(data);
    return true;
  }
  pong() {
    const head = encodeWsHead(0, Opcode.pong);
    this.sendFrame(head);
  }
  private sendFrame(data: Uint8Array) {
    if (this.status !== WS_STATUS.OPEN) throw new WebSocketStatusError();
    this.socket.write(data);
  }
  private onPing() {
    return this.pong();
  }
  private onError(err: any) {}
  private onMessage(data: Uint8Array | string) {}
  private onClose() {}

  #pingWaitingQueue: WithPromise<void>[] = [];
  ping(): Promise<void> {
    //ping操作
    const head = encodeWsHead(0, Opcode.ping);
    this.sendFrame(head);
    const pms = withPromise<void>();
    this.#pingWaitingQueue.push(pms);
    return pms.promise;
  }
  destroy(err?: any) {
    return this.socket.destroy(err);
  }
  private finalClose() {
    if (this.status === WS_STATUS.CLOSED) return;
    this.status = WS_STATUS.CLOSED;
    if (!this.socket.writableEnded) this.socket.end(() => this.socket.destroy());
    else this.socket.destroy();

    const err = new WebSocketStatusError();
    for (const item of this.#pingWaitingQueue) {
      item.reject(err);
    }
    this.#pingWaitingQueue.length = 0;
    this.onClose();
  }
  status: number = WS_STATUS.OPEN;
  /** 发送 close 帧 */
  close(): void;
  close(data?: WebSocketData) {
    if (this.status !== WS_STATUS.OPEN) throw new WebSocketStatusError();

    let size: number = 0;
    if (typeof data === "string") {
      data = Buffer.from(data, "utf-8");
      size = data.byteLength;
    } else if (Buffer.isBuffer(data)) size = data.byteLength;

    const head = encodeWsHead(size, Opcode.close);
    this.sendFrame(head);
    this.status = WS_STATUS.CLOSING;
  }
}
export const WS_STATUS = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};
export type WebSocketData = string | Uint8Array;

class UnsupportedDataType extends Error {
  constructor() {
    super("不支持的数据类型");
  }
}
class WebSocketStatusError extends Error {}
interface WsFrameHead {
  fin: boolean;
  rsv1: boolean;
  rsv2: boolean;
  rsv3: boolean;

  opcode: Opcode;
  useMask: boolean;
  firstLength: number;
  payloadLength?: bigint;
  maskKey?: Uint8Array;
}

/** 编码webSocket数据帧的头部
 * @param size 此次要写入的数据大小(字节)
 * @param opcode 可选。数据帧类型代码
 * @param maskKey 可选。<boolean>:是否使用随机掩码 <Buffer>:使用MASK的前4位作为掩码，MASK的长度小于4位则抛出异常
 * @param hasSplit 是否是分片
 */
function encodeWsHead(size: number | bigint, opcode: Opcode, maskKey?: number, hasSplit?: boolean) {
  //编码webSocket头部
  if (size < 0) throw new Error("参数必须为正数");
  const useMask = typeof maskKey === "number";

  let buffer: Buffer;
  const baseLen = useMask ? 6 : 2;
  if (size > 0xffff) {
    buffer = Buffer.allocUnsafe(baseLen + 8);
    buffer[1] = useMask ? 0x7f | 0x80 : 0x7f;

    buffer.writeBigInt64BE(BigInt(size), 2);
  } else {
    size = Number(size);
    if (size < 0x7e) {
      buffer = Buffer.allocUnsafe(baseLen);
      buffer[1] = useMask ? size | 0x80 : size;
    } else {
      buffer = Buffer.allocUnsafe(baseLen + 2);
      buffer[1] = useMask ? 0x7e | 0x80 : 0x7e;
      buffer.writeUInt16BE(size, 2);
    }
  }
  const FIN: number = hasSplit ? 0 : 0x80;
  buffer[0] = FIN + opcode;

  if (useMask) buffer.writeUint32BE(maskKey, baseLen);
  return buffer;
}
/** 解码ws头部 */
function decodeWsHead(buf: Buffer): WsFrameHead {
  return {
    fin: Boolean(buf[0] >>> 7),
    rsv1: Boolean((buf[0] & 0x40) >>> 6),
    rsv2: Boolean((buf[0] & 0x20) >>> 5),
    rsv3: Boolean((buf[0] & 0x10) >>> 4),
    opcode: buf[0] & 0x0f,
    useMask: Boolean(buf[1] >>> 7),
    firstLength: buf[1] & 0x7f,
  };
}
function encodeMsg(data: Uint8Array, maskKey: Uint8Array, offset: bigint = 0n) {
  let k = Number(offset % 4n);
  for (let i = 0; i < data.length; i++) {
    data[i] = data[i] ^ maskKey[k % 4];
    k++;
  }
}
