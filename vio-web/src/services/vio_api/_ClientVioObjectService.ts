import { ClientObjectBaseExposed, VioObjectCreateDto } from "@asla/vio/client";
import { EventTrigger } from "evlib";
import { RpcService, RpcExposed } from "cpcall";
import { VioObject } from "@asla/vio";

@RpcService()
export class ClientVioObjectBaseService implements ClientObjectBaseExposed {
  protected uiObjects = new Map<number, VioObject>();
  @RpcExposed()
  deleteObject(...idList: number[]): void {
    for (const id of idList) {
      this.uiObjects.delete(id);
    }
    this.deleteEvent.emit(undefined);
  }
  @RpcExposed()
  createObject(info: VioObjectCreateDto): void {
    this.uiObjects.set(info.id, info);
    this.createEvent.emit(info);
  }

  protected async unwatchObject(objectId: number) {}

  get(id: number): VioObject | undefined {
    return this.uiObjects.get(id);
  }
  getAll(): IterableIterator<VioObject> {
    return this.uiObjects.values();
  }
  clearObject() {
    this.uiObjects.clear();
    this.deleteEvent.emit(undefined);
  }
  get size() {
    return this.uiObjects.size;
  }

  getObjectInfo(id: number): VioObject | undefined {
    return this.uiObjects.get(id);
  }

  /** 如果参数位undefined， 则是同时删除多个 */
  readonly deleteEvent = new EventTrigger<number | undefined>();
  /** 如果参数位undefined， 则是同时创建多个 */
  readonly createEvent = new EventTrigger<VioObjectCreateDto | undefined>();
}
