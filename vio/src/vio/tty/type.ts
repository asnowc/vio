/**
 * @public
 * @category TTY
 */
export type TtyWriteTextType = "warn" | "log" | "error" | "info";
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
