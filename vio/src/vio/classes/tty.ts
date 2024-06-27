import { LinkedCacheQueue } from "evlib/data_struct";
import type {
  SelectItem,
  SelectKey,
  TtyOutputData,
  TtyInputsReq,
  TtyInputReq,
  TtyOutputsData,
  EncodedImageData,
  RawImageData,
  TtyWriteTextType,
  VioFileData,
} from "../api_type/tty.type.ts";
import { VioChart } from "./VioChart.ts";
import { createTypeErrorDesc } from "evlib/errors";

/** @public */
export type WriteTtyTextOpts = {
  msgType?: TtyWriteTextType;
  content?: string;
};
/** @public */
export type TtyReadFileOpts = {
  mime?: string;
  title?: string;
  /** 文件大小限制，单位字节 */
  maxByteSize?: number;
};
/** 终端实例
 * @public
 */
export abstract class TTY {
  /** 写入任意数据 */
  abstract write(data: TtyOutputsData): void;
  writeImage(imageData: EncodedImageData | RawImageData): void {
    if (typeof (imageData as EncodedImageData).mime === "string") {
      const image = imageData as EncodedImageData;
      return this.write({ type: "image", image, imageDataType: 0 } satisfies TtyOutputData.Image);
    } else {
      const image = imageData as RawImageData;
      return this.write({ type: "image", image, imageDataType: 1 } satisfies TtyOutputData.Image);
    }
  }
  writeTable(data: any[][], header?: string[]): void {
    return this.write({ type: "table", data, header } satisfies TtyOutputData.Table);
  }
  writeText(title: string, opts: TtyWriteTextType | WriteTtyTextOpts = {}): void {
    let content: string | undefined;
    let msgType: TtyOutputData.Text["msgType"] | undefined;
    if (typeof opts === "string") msgType = opts;
    else {
      content = opts.content;
      msgType = opts.msgType;
    }

    return this.write({
      type: "text",
      title,
      content,
      msgType,
    } satisfies TtyOutputData.Text);
  }
  writeUiLink(ui: VioChart<number>): void {
    if (!(ui instanceof VioChart)) throw new Error("Unsupported UI object");
    this.write({ type: "link", uiType: "chart", id: ui.id } satisfies TtyOutputData.UILink);
  }
  /** 读取任意数据 */
  abstract read<T = unknown>(config: TtyInputsReq): Promise<T>;
  async readFile(opts: TtyReadFileOpts = {}): Promise<VioFileData> {
    return this.read({ type: "file", mime: opts.mime, maxSize: opts.maxByteSize });
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

type WriteTty = (ttyId: number, data: TtyOutputsData) => void;
export abstract class CacheTty extends TTY {
  constructor(
    readonly ttyIndex: number,
    cacheSize: number,
    writeTty?: WriteTty,
  ) {
    super();
    this.#writeTty = writeTty;
    this.#outputCache = new LinkedCacheQueue(cacheSize);
  }
  #writeTty?: WriteTty;
  #outputCache: LinkedCacheQueue<{ data: TtyOutputsData }>;
  get cachedSize() {
    return this.#outputCache.size;
  }
  get cacheSize() {
    return this.#outputCache.maxSize;
  }
  set cacheSize(size: number) {
    this.#outputCache.maxSize = size;
  }
  *getCache(): Generator<TtyOutputsData, void, void> {
    for (const item of this.#outputCache) {
      yield item.data;
    }
  }

  /** @implements */
  write(data: TtyOutputsData): void {
    this.#outputCache.push({ data });
    if (!this.#writeTty) return;
    this.#writeTty(this.ttyIndex, data);
  }
  get disposed() {
    return !this.#writeTty;
  }
  dispose() {
    // dispose 后保留 cache
    this.#writeTty = undefined;
  }
}

class InvalidInputDataError extends Error {
  constructor(msg: string = "invalid input data") {
    super(msg);
  }
}
