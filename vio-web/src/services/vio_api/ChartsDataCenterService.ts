import {
  ChartUpdateData,
  VioChartBase,
  VioServerExposed,
  ClientObjectExposed,
  VioObjectCreateDto,
  ClientChartExposed,
  ClientTableExposed,
} from "@asla/vio/client";
import { EventTrigger } from "evlib";
import { MakeCallers, RpcService, RpcExposed } from "cpcall";
import { ChartDataItem, ChartInfo, VioChartCreateConfig, VioObject } from "@asla/vio";
import { TableRow } from "@asla/vio/vio/vio_object/table/table.type.ts";

@RpcService()
class VioObjectService implements ClientObjectExposed {
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

@RpcService()
export class ChartsDataCenterService extends VioObjectService implements ClientChartExposed, ClientTableExposed {
  @RpcExposed()
  writeChart(chartId: number, data: ChartUpdateData<any>): void {
    this.writeEvent.emit({ id: chartId, data });
  }

  #serverApi?: MakeCallers<Pick<VioServerExposed, "chart" | "object">>;
  init(serverApi?: MakeCallers<Pick<VioServerExposed, "chart" | "object">>) {
    this.#serverApi = serverApi;
    if (serverApi) {
      this.uiObjects.clear();
      serverApi.object.getObjects().then(({ list }) => {
        for (const item of list) {
          if (this.uiObjects.has(item.id)) continue;
          this.uiObjects.set(item.id, item);
        }
      });
    }
  }

  async getChart(chartId: number): Promise<ChartInfo<number> | undefined> {
    return this.#serverApi!.chart.getChartInfo(chartId);
  }
  async requestUpdate(chartId: number): Promise<ChartDataItem<any> | undefined> {
    if (!this.#serverApi) throw new Error("没有连接");
    return this.#serverApi.chart.requestUpdateChart(chartId);
  }
  addRow(tableId: number, param: TableRow, afterIndex: number): void {
    //TODO table
  }
  deleteRow(tableId: number, rowKey: string): void {
    //TODO table
  }
  updateRow(tableId: number, row: TableRow, rowKey: string): void {
    //TODO table
  }
  updateTable(tableId: number, data: TableRow[]): void {
    //TODO table
  }

  readonly writeEvent = new EventTrigger<{ id: number; data: ChartUpdateData<any> }>();
}

export class ChartClientAgent<T = number> extends VioChartBase<T> {
  constructor(config: VioChartCreateConfig<T>) {
    super(config);
  }
  pushCache(...items: ChartDataItem<T>[]): void {
    super.pushCache(...items);
  }
  updateData(data: T, timeName?: string | undefined): void {
    this.pushCache({ data: data, timestamp: Date.now(), timeName: timeName });
  }
}
