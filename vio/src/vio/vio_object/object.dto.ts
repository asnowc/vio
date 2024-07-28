import { MaybePromise } from "../../type.ts";
import { ChartUpdateData } from "./chart/chart.dto.ts";

export interface VioObjectCreateDto {
  name?: string;
  id: number;
  type: string;
}
export interface VioObjectDto {
  name?: string;
  id: number;
  type: string;
}
export interface ChartController {
  /** 删除指定 UI 对象 */
  deleteObject(objectId: number): void;
  /** 创建 UI 对象 */
  createObject(info: VioObjectCreateDto): void;
  /** 在指定图表输出数据 */
  writeChart(chartId: number, data: Readonly<ChartUpdateData<any>>): void;
}

export interface ServerObjectExposed {
  getObjects(filter?: { name?: string; type?: string }): MaybePromise<{ list: VioObjectCreateDto[] }>;
}
export interface ClientObjectExposed {
  /** 删除指定 UI 对象 */
  deleteObject(objectId: number): void;
  /** 创建 UI 对象 */
  createObject(info: VioObjectCreateDto): void;
}
