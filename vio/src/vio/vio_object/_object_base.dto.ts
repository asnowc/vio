import { MaybePromise } from "../../type.ts";

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
export interface ServerObjectBaseExposed {
  getObjects(filter?: { name?: string; type?: string }): MaybePromise<{ list: VioObjectCreateDto[] }>;
}
export interface ClientObjectBaseExposed {
  /** 删除指定 UI 对象 */
  deleteObject(objectId: number): void;
  /** 创建 UI 对象 */
  createObject(info: VioObjectCreateDto): void;
}
