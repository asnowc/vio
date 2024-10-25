import { TTY } from "./_TTY.ts";
import { TtyCommandInfo, TtyInputsReq, TtyOutputsData } from "./tty.dto.ts";

/**
 * @public
 * @category TTY
 */
export type RawImageData = {
  /** 图像宽度 */
  width: number;
  /** 图像高度 */
  height: number;
  /**
   * 图像二进制数据，必须满足 data.length === width * height * channel。
   * 数据由多个 width*height 长度的通道数据组成
   */
  data: Uint8Array;
  /** 图像通道数 */
  channel: number;
  separate?: boolean;
};
/**
 * 编码的图像数据，如 jpg、png等
 * @public
 * @category TTY
 */
export type EncodedImageData = {
  data: Uint8Array;
  mime: string;
};
/**
 * @public
 * @category TTY
 */
export type VioFileData = {
  name: string;
  data: Uint8Array;
  mime: string;
};
/**
 * @public
 * @category TTY
 */
export type SelectKey = string | number;
/**
 * @public
 * @category TTY
 */
export type SelectItem<T extends SelectKey = SelectKey> = { value: T; label?: string };

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
  /** 设置命令，如果call 为 undefined，则删除命令 */
  setCommand(command: string, call?: TtyCommand): void;
}
/**
 * @public
 * @category TTY
 */
export interface TtyCenter {
  /** 获取指定索引的 TTY. 如果不存在，则创建后返回 */
  get(ttyId: number): VioTty;
  getCreated(index: number): VioTty | undefined;
  /** 获取所有已创建的 TTY */
  getAll(): IterableIterator<VioTty>;
  /** 删除指定索引的 TTY */
  delete(tty: VioTty): boolean;
  /**
   * 设置命令，如果call 为 undefined，则删除命令
   * @param ttyId - 如果为空，则设置到 tty0
   */
  setCommand(command: string, call?: TtyCommand, ttyId?: number): void;
}
/**
 * @public
 * @category TTY
 */
export interface TtyCommand<T extends {} = {}> {
  call(args: T, commandInfo: { command: string }): void;
  description?: string;
  args?: Record<string, TtyInputsReq>;
}
