//纯输出数据
/** @public */
export type TtyWriteTextType = "warn" | "log" | "error" | "info";

/** 终端输出消息
 */
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
  } /** 请求选择 */
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
/** @public */
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
 */
export type EncodedImageData = {
  data: Uint8Array;
  mime: string;
};
/** @public */
export type VioFileData = {
  name: string;
  data: Uint8Array;
  mime: string;
};
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
  | TtyOutputData.Custom;

/** @public */
export type SelectKey = string | number;
/** @public */
export type SelectItem<T extends SelectKey = SelectKey> = { value: T; label?: string };
