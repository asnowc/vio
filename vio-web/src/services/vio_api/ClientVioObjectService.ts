import {
  ChartUpdateData,
  VioChartBase,
  ServerObjectExposed,
  VioObjectCreateDto,
  ClientObjectExposed,
  Column,
  TableCreateOption,
  ServerTableExposed,
  Key,
  TableChanges,
} from "@asla/vio/client";
import { EventTrigger } from "evlib";
import { MakeCallers, RpcService, RpcExposed } from "cpcall";
import { ChartDataItem, ChartInfo, TableFilter, TableRow, VioChartCreateConfig, VioObject } from "@asla/vio/client";

@RpcService()
export class ClientVioObjectService implements ClientObjectExposed {
  protected uiObjects = new Map<number, VioObject>();
  @RpcExposed()
  deleteObject(...idList: number[]): void {
    let deleted: Record<string, boolean> = {};
    for (const id of idList) {
      let obj = this.uiObjects.get(id);
      if (!obj) {
        console.error("RPC 删除不存在的 VioObject", id);
        continue;
      }
      deleted[obj.type] = true;
      this.uiObjects.delete(id);
    }
    this.deleteObjEvent.emit(new Set(idList));
  }
  @RpcExposed()
  createObject(info: VioObjectCreateDto): void {
    this.uiObjects.set(info.id, info);
    this.createObjEvent.emit(info);
  }
  readonly createObjEvent = new EventTrigger<undefined | VioObject>();
  readonly deleteObjEvent = new EventTrigger<Set<number>>();
  private async unwatchObject(objectId: number) {}

  clearObject() {
    const keys = new Set(this.uiObjects.keys());
    this.uiObjects.clear();
    this.#watchingChart = {};
    this.#watchingTable = {};

    this.deleteObjEvent.emit(keys);
  }

  /* Chart */

  @RpcExposed()
  writeChart(chartId: number, data: ChartUpdateData<any>): void {
    this.writeChartEvent.emit({ id: chartId, data });
  }

  #serverApi?: MakeCallers<ServerObjectExposed>;
  init(serverApi?: MakeCallers<ServerObjectExposed>) {
    this.#serverApi = serverApi;
    if (serverApi) {
      this.uiObjects.clear();
      serverApi.getObjects().then(({ list }) => {
        for (const item of list) {
          if (this.uiObjects.has(item.id)) continue;
          this.uiObjects.set(item.id, item);
        }
        if (list?.length) {
          this.createObjEvent.emit(undefined);
        }
      });
    }
  }
  #watchingChart: Record<number, ChartClientAgent | Promise<ChartClientAgent>> = {};
  async getChart(chartId: number): Promise<ChartInfo<number> | undefined> {
    return this.#serverApi!.getChartInfo(chartId);
  }
  async unwatchChart(chartId: number) {
    delete this.#watchingTable[chartId];
    await this.unwatchObject(chartId);
  }
  async requestUpdate(chartId: number): Promise<ChartDataItem<any> | undefined> {
    if (!this.#serverApi) throw new Error("没有连接");
    return this.#serverApi.requestUpdateChart(chartId);
  }
  *getChartSampleList() {
    for (const item of this.uiObjects.values()) {
      if (item.type === "chart") yield item;
    }
  }
  readonly writeChartEvent = new EventTrigger<{ id: number; data: ChartUpdateData<any> }>();

  /* Table */

  #watchingTable: Record<number, TableClientAgent | Promise<TableClientAgent>> = {};
  async getTable(tableId: number): Promise<TableClientAgent> {
    if (this.#watchingTable[tableId]) return this.#watchingTable[tableId];

    const promise = this.#serverApi!.getTable(tableId).then(
      async ({ columns, id, ...option }) => {
        const table = new TableClientAgent(tableId, columns, option, this.#serverApi!);
        this.#watchingTable[id] = table;
        return table;
      },
      (err) => {
        delete this.#watchingTable[tableId];
        throw err;
      },
    );
    this.#watchingTable[tableId] = promise;
    return promise;
  }
  async getTableData(tableId: number, filter?: TableFilter) {
    return this.#serverApi!.getTableData(tableId, filter);
  }
  async unwatchTable(tableId: number) {
    delete this.#watchingTable[tableId];
    await this.unwatchObject(tableId);
  }
  #getTable(id: number) {
    const table = this.#watchingTable[id];
    if (table instanceof TableClientAgent) return table;
  }
  @RpcExposed()
  updateTable(tableId: number): void {
    const table = this.#getTable(tableId);
    if (!table) return;
    table.needReloadEvent.emit();
  }
  @RpcExposed()
  tableChange(tableId: number, changes: TableChanges<TableRow>): void {
    const table = this.#getTable(tableId);
    if (!table) return;
    table.needReloadEvent.emit();
  }

  *getTableSampleList() {
    for (const item of this.uiObjects.values()) {
      if (item.type === "table") yield item;
    }
  }
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
export class TableClientAgent<Row extends TableRow = TableRow, Add extends object = Row, Update extends object = Add> {
  constructor(
    readonly id: number,
    readonly columns: Readonly<Column<TableRow>>[],
    option: TableCreateOption,
    private api: MakeCallers<ServerTableExposed>,
  ) {
    this.config = option ?? {};
  }
  readonly config: TableCreateOption;
  readonly needReloadEvent = new EventTrigger<void>();
  async onRowAction(opKey: string, rowKey: Key) {
    await this.api.onTableRowAction(this.id, opKey, rowKey);
  }
  async onTableAction(opKey: string, selectedKeys: Key[]) {
    await this.api.onTableAction(this.id, opKey, selectedKeys);
  }
  async onAdd(param: Add) {
    await this.api.onTableRowAdd(this.id, param);
  }
  async onUpdate(rowKey: Key, param: Update) {
    await this.api.onTableRowUpdate(this.id, rowKey, param);
  }
}
export type { Key };
