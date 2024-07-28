import type { TtyOutputData, TtyInputsReq, TtyInputReq, TtyOutputsData } from "./tty.dto.ts";
import type {
  SelectItem,
  SelectKey,
  EncodedImageData,
  RawImageData,
  TtyWriteTextType,
  VioFileData,
} from "./type.ts";
import type { VioObject } from "../vio_object/object.type.ts";
import { createTypeErrorDesc } from "evlib";

/**
 * @public
 * @category TTY
 */
export type TTyWriteTextOption = {
  /** 文本类型 */
  msgType?: TtyWriteTextType;
  content?: string;
};
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
/**
 * 终端实例
 * @public
 * @category TTY
 */
export abstract class TTY {
  /** 写入任意数据 */
  abstract write(data: TtyOutputsData): void;
  /** 输出图像 */
  writeImage(imageData: EncodedImageData | RawImageData): void {
    if (typeof (imageData as EncodedImageData).mime === "string") {
      const image = imageData as EncodedImageData;
      return this.write({ type: "image", image, imageDataType: 0 } satisfies TtyOutputData.Image);
    } else {
      const image = imageData as RawImageData;
      return this.write({ type: "image", image, imageDataType: 1 } satisfies TtyOutputData.Image);
    }
  }
  /**
   * 输出表格
   * @alpha
   */
  writeTable(data: any[][], header?: string[]): void {
    return this.write({ type: "table", data, header } satisfies TtyOutputData.Table);
  }
  /** 输出文本 */
  writeText(title: string, option: TtyWriteTextType | TTyWriteTextOption = {}): void {
    let content: string | undefined;
    let msgType: TtyOutputData.Text["msgType"] | undefined;
    if (typeof option === "string") msgType = option;
    else {
      content = option.content;
      msgType = option.msgType;
    }

    return this.write({
      type: "text",
      title,
      content,
      msgType,
    } satisfies TtyOutputData.Text);
  }
  writeUiLink(ui: VioObject): void {
    throw new Error("Unsupported UI object");
    this.write({ type: "link", uiType: "chart", id: ui.id } satisfies TtyOutputData.UILink);
  }
  /** 读取任意数据 */
  abstract read<T = unknown>(config: TtyInputsReq): Promise<T>;
  /** 请求输入文件 */
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

  /** 提示读取文本 */
  async readText(title: string, max?: number): Promise<string>;
  /** 读取文本 */
  async readText(max?: number): Promise<string>;
  async readText(title_max?: string | number, max?: number): Promise<string> {
    let res: unknown;
    if (typeof title_max === "string") res = await this.read({ type: "text", title: title_max, maxLen: max });
    else res = await this.read({ type: "text", maxLen: title_max });
    if (typeof res !== "string") throw new InvalidInputDataError(createTypeErrorDesc("string", typeof res));
    return res;
  }
  /** 请求确认 */
  async confirm(title: string, content?: string): Promise<boolean> {
    const res = await this.read({ type: "confirm", title, content });
    return Boolean(res);
  }
  /** 单选 */
  pick<T extends SelectKey = SelectKey>(title: string, options: SelectItem<T>[]): Promise<T> {
    return this.select(title, options, { min: 1, max: 1 }).then((res) => res[0]);
  }
  /** 多选 */
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
