import { MaybePromise } from "../../type.ts";
import { EncodedImageData, RawImageData, SelectItem, TtyWriteTextType, VioFileData } from "./type.ts";

/** 终端输出数据 */
export namespace TtyOutputData {
  export interface Text {
    type: "text";
    /** 文本数据 */
    title: string;
    content?: string;
    msgType?: TtyWriteTextType;
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

export interface ServerTtyExposed {
  /** 获取 TTY 输出缓存日志 */
  getTtyCache(ttyId: number): MaybePromise<TtyOutputsData[]>;
  /** 切换 TTY 读取权限 */
  setTtyReadEnable(ttyId: number, enable: boolean): MaybePromise<boolean>;
  /** 解决 tty 输入请求 */
  resolveTtyReadRequest(ttyId: number, requestId: number, res: any): MaybePromise<boolean>;
  /** 拒绝 tty 输入请求 */
  rejectTtyReadRequest(ttyId: number, requestId: number, reason?: any): MaybePromise<boolean>;

  inputTty(ttyId: number, data: any): MaybePromise<boolean>;
}
export interface ClientTtyExposed {
  /** 在指定 TTY 输出数据 */
  writeTty(ttyId: number, data: TtyOutputsData): void;
  /** 在指定 TTY 发送读取请求 */
  sendTtyReadRequest(ttyId: number, requestId: number, opts: TtyInputsReq): void;
  /** 切换 TTY 读取权限 */
  ttyReadEnableChange(ttyId: number, enable: boolean): void;
}
