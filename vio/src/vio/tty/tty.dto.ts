import { MaybePromise } from "../../type.ts";
import { EncodedImageData, RawImageData, SelectItem, VioFileData } from "./type.ts";

/** 终端输出数据 */
export namespace TtyOutputData {
  export interface Text {
    type: "log" | "warn" | "error" | "info";
    content: any[];
  }
  /**   控件链接 */
  export interface UILink {
    type: "link";
    uiType: string;
    id: number | string;
  }
  export interface Table<T = string | number> {
    type: "table";
    data: readonly (readonly T[])[];
    header?: readonly string[];
  }
  export type Image = {
    type: "image";
  } & ({ image: EncodedImageData; imageDataType: 0 } | { image: RawImageData; imageDataType: 1 });
  export interface Custom {
    type?: undefined;
    [key: string | number]: any;
  }
}
export namespace TtyInputReq {
  export interface File {
    type: "file";
    title?: string;
    mime?: string;
    /** 文件大小限制，单位字节 */
    maxSize?: number;
    maxNumber?: number;
    minNumber?: number;
  }
  export type FileResult = {
    list: VioFileData[];
  };

  /** 请求选择 */
  export interface Select {
    type: "select";
    options: SelectItem[];
    title: string;
    /** 最小选择数量 */
    min?: number;
    /** 最大选择数量 */
    max?: number;
  }
  /** 请求输入文本 */
  export interface Text {
    type: "text";
    title?: string;
    maxLen?: number;
  } /** 请求输入文本 */

  export interface Confirm {
    type: "confirm";
    title: string;
    content?: string;
  }
  export interface Custom {
    type?: undefined;
    [key: string | number]: any;
  }
}
WebSocket;
export type TtyOutputsData =
  | TtyOutputData.Text
  | TtyOutputData.Table
  | TtyOutputData.Image
  | TtyOutputData.UILink
  | TtyOutputData.Custom;

export type TtyInputsReq =
  | TtyInputReq.Text
  | TtyInputReq.Confirm
  | TtyInputReq.File
  | TtyInputReq.Select
  | TtyInputReq.Custom;

export interface TtyCommandInfo {
  command: string;
  description?: string;
  args?: { key: string; type: TtyInputsReq; required?: boolean }[];
  ttyId: number;
}
export interface ServerTtyExposed {
  /** 获取 TTY 输出缓存日志 */
  getTtyCache(ttyId: number): MaybePromise<TtyOutputsData[]>;
  /** 解决 tty 输入请求 */
  resolveTtyReadRequest(ttyId: number, requestId: number, res: any): MaybePromise<boolean>;
  /** 拒绝 tty 输入请求 */
  rejectTtyReadRequest(ttyId: number, requestId: number, reason?: any): MaybePromise<boolean>;
  /** 客户端主动输入 */
  inputTty(ttyId: number, data: any): MaybePromise<boolean>;
  /** 执行命令 */
  execCommand(ttyId: number, command: string, args?: Record<string, any>): boolean;
  /** 获取服务端命令列表 */
  getTtyCommands(options?: GetTtyCommandsOption): MaybePromise<{ list: TtyCommandInfo[] }>;
}
export interface GetTtyCommandsOption {
  /** 指定终端id */
  ttyId?: number;
  /** 搜索命令，搜索包括命令和描述 */
  search?: string;
  /** 分页，从 0 开始 */
  page?: number;
  /** 分页大小 */
  pageSize?: number;
}
export interface ClientTtyExposed {
  /** 在指定 TTY 输出数据 */
  writeTty(ttyId: number, data: TtyOutputsData): void;
  /** 在指定 TTY 发送读取请求 */
  sendTtyReadRequest(ttyId: number, requestId: number, opts: TtyInputsReq): void;
  /** 取消指定 TTY 的读取请求 */
  cancelTtyReadRequest(ttyId: number, requestId: number): void;
}
