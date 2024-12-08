import type { TtyOutputData, TtyInputsReq, TtyInputReq, TtyOutputsData } from "./tty.dto.ts";
import type { SelectItem, SelectKey, EncodedImageData, RawImageData, VioFileData } from "./type.ts";
import type { VioObject } from "../vio_object/_object_base.type.ts";
import { createTypeErrorDesc } from "evlib";

/**
 * 请求输入文件的选项
 * @public
 * @category TTY
 */
export type TtyReadFileOption = {
  /** 文件 MIME 类型 */
  mime?: string;
  title?: string;
  /** 单个文件大小限制，单位字节 */
  maxByteSize?: number;
  /** 最大上传文件数量 */
  maxNumber?: number;
  /** 最小上传文件数量 */
  minNumber?: number;
};
/** @public */
export interface TtyInput {
  /** 请求输入文件 */
  readFiles(option?: TtyReadFileOption): Promise<VioFileData[]>;
  /** 提示读取文本 */
  readText(title: string, max?: number): Promise<string>;
  /** 读取文本 */
  readText(max?: number): Promise<string>;
  /** 请求确认 */
  confirm(title: string, content?: string): Promise<boolean>;
  /** 单选 */
  pick<T extends SelectKey = SelectKey>(title: string, options: SelectItem<T>[]): Promise<T>;
  /** 多选 */
  select<T extends SelectKey = SelectKey>(
    title: string,
    options: SelectItem<T>[],
    config?: { min?: number; max?: number },
  ): Promise<T[]>;
}
/** @public */
export interface TtyOutput {
  /** 输出图像 */
  writeImage(imageData: EncodedImageData | RawImageData): void;
  /**
   * 输出表格
   * @alpha
   */
  writeTable(data: any[][], title?: string): void;
  log(...args: string[]): void;
  warn(...args: string[]): void;
  error(...args: string[]): void;
  info(...args: string[]): void;
  // writeUiLink(ui: VioObject): void;
}
function writeText(type: TtyOutputData.Text["type"], args: any[]): TtyOutputData.Text {
  return { type, content: args };
}
/**
 * 终端实例
 * @public
 * @category TTY
 */
export abstract class TTY implements TtyInput, TtyOutput {
  /** 写入任意数据 */
  abstract write(data: TtyOutputsData): void;
  /** @override */
  writeImage(imageData: EncodedImageData | RawImageData): void {
    if (typeof (imageData as EncodedImageData).mime === "string") {
      const image = imageData as EncodedImageData;
      return this.write({ type: "image", image, imageDataType: 0 } satisfies TtyOutputData.Image);
    } else {
      const image = imageData as RawImageData;
      return this.write({ type: "image", image, imageDataType: 1 } satisfies TtyOutputData.Image);
    }
  }
  /** @override */
  writeTable<T extends {}>(data: T[], title?: string): void {
    return this.write({ type: "table", data, title } satisfies TtyOutputData.Table);
  }
  /** @override */
  log(...args: any[]): void {
    this.write(writeText("log", args));
  }
  /** @override */
  warn(...args: any[]): void {
    this.write(writeText("warn", args));
  }
  /** @override */
  error(...args: any[]): void {
    this.write(writeText("error", args));
  }
  /** @override */
  info(...args: any[]): void {
    this.write(writeText("info", args));
  }
  /** @override */
  writeUiLink(ui: VioObject): void {
    throw new Error("Unsupported UI object");
    this.write({ type: "link", uiType: "chart", id: ui.id } satisfies TtyOutputData.UILink);
  }
  /** 读取任意数据 */
  abstract read<T = unknown>(config: TtyInputsReq): Promise<T>;
  /** @override */
  async readFiles(option: TtyReadFileOption = {}): Promise<VioFileData[]> {
    return this.read<TtyInputReq.FileResult>({
      type: "file",
      title: option.title,
      mime: option.mime,
      maxSize: option.maxByteSize,
      maxNumber: option.maxNumber,
      minNumber: option.minNumber,
    }).then(({ list }) => {
      return list;
    });
  }

  async readText(title: string, max?: number): Promise<string>;
  async readText(max?: number): Promise<string>;
  /** @override */
  async readText(title_max?: string | number, max?: number): Promise<string> {
    let res: unknown;
    if (typeof title_max === "string") res = await this.read({ type: "text", title: title_max, maxLen: max });
    else res = await this.read({ type: "text", maxLen: title_max });
    if (typeof res !== "string") throw new InvalidInputDataError(createTypeErrorDesc("string", typeof res));
    return res;
  }
  /** @override */
  async confirm(title: string, content?: string): Promise<boolean> {
    const res = await this.read({ type: "confirm", title, content });
    return Boolean(res);
  }
  /** @override */
  pick<T extends SelectKey = SelectKey>(title: string, options: SelectItem<T>[]): Promise<T> {
    return this.select(title, options, { min: 1, max: 1 }).then((res) => res[0]);
  }
  /** @override */
  async select<T extends SelectKey = SelectKey>(
    title: string,
    options: SelectItem<T>[],
    config: { min?: number; max?: number } = {},
  ): Promise<T[]> {
    const { max, min } = config;
    const keys = new Set<string | number>();
    for (let i = 0; i < options.length; i++) keys.add(options[i].value);

    const res = await this.read({
      type: "select",
      options,
      title,
      min,
      max,
    } satisfies TtyInputReq.Select);
    if (!(res instanceof Array)) throw new InvalidInputDataError(createTypeErrorDesc("Array", typeof res));
    if (min && res.length < min) throw new InvalidInputDataError("The selected quantity is less than the set value");
    let selectedValues: any[] = res;
    if (max && res.length > max) selectedValues = res.slice(0, max);
    for (let i = 0; i < selectedValues.length; i++) {
      if (!keys.has(selectedValues[i]))
        throw new InvalidInputDataError("The selected value does not exist in the options");
    }
    return selectedValues;
  }
}

class InvalidInputDataError extends Error {
  constructor(msg: string = "invalid input data") {
    super(msg);
  }
}
