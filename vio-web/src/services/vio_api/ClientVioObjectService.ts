import {
  ChartUpdateData,
  VioChartBase,
  ClientChartExposed,
  ServerObjectExposed,
  VioTableBase,
  ClientTableExposed,
} from "@asla/vio/client";
import { EventTrigger } from "evlib";
import { MakeCallers, RpcService, RpcExposed } from "cpcall";
import { ChartDataItem, ChartInfo, TableRow, VioChartCreateConfig } from "@asla/vio";
import { ClientVioObjectBaseService } from "./_ClientVioObjectService.ts";

@RpcService()
export class ClientVioObjectService
  extends ClientVioObjectBaseService
  implements ClientChartExposed, ClientTableExposed
{
  /* Chart */

  @RpcExposed()
  writeChart(chartId: number, data: ChartUpdateData<any>): void {
    this.writeEvent.emit({ id: chartId, data });
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
      });
    }
  }
  #watchingChart: Record<number, ChartClientAgent | Promise<ChartClientAgent>> = {};
  async getChart(chartId: number): Promise<ChartInfo<number> | undefined> {
    return this.#serverApi!.getChartInfo(chartId);
  }
  async unwatchChart(chartId: number) {
    delete this.#watchingTable[chartId];
    await super.unwatchObject(chartId);
  }
  async requestUpdate(chartId: number): Promise<ChartDataItem<any> | undefined> {
    if (!this.#serverApi) throw new Error("没有连接");
    return this.#serverApi.requestUpdateChart(chartId);
  }
  *getChartSampleList() {
    for (const item of this.getAll()) {
      if (item.type === "chart") yield item;
    }
  }
  readonly writeEvent = new EventTrigger<{ id: number; data: ChartUpdateData<any> }>();

  /* Table */

  #watchingTable: Record<number, TableClientAgent | Promise<TableClientAgent>> = {};
  async getTable(tableId: number): Promise<TableClientAgent> {
    if (this.#watchingTable[tableId]) return this.#watchingTable[tableId];
    return this.#serverApi!.getTable(tableId).then(
      ({ columns, id, ...option }) => {
        const table = new TableClientAgent(tableId, columns, option);
        this.#watchingTable[id] = table;
        return table;
      },
      (err) => {
        delete this.#watchingTable[tableId];
        throw err;
      },
    );
  }
  async unwatchTable(tableId: number) {
    delete this.#watchingTable[tableId];
    await super.unwatchObject(tableId);
  }
  #getTable(id: number) {
    const table = this.#watchingTable[id];
    if (table instanceof TableClientAgent) return table;
  }
  @RpcExposed()
  addTableRow(tableId: number, param: TableRow, afterIndex: number): void {
    const table = this.#getTable(tableId);
    if (!table) return;
    table.addRow(param, afterIndex);
    table.tableChange.emit();
  }
  @RpcExposed()
  deleteTableRow(tableId: number, index: number, count: number): void {
    const table = this.#getTable(tableId);
    if (!table) return;
    table.deleteRow(index, count);
    table.tableChange.emit();
  }
  @RpcExposed()
  updateTableRow(tableId: number, row: TableRow, index: number): void {
    const table = this.#getTable(tableId);
    if (!table) return;
    table.updateRow(row, index);
    table.tableChange.emit();
  }
  @RpcExposed()
  updateTable(tableId: number, data: TableRow[]): void {
    const table = this.#getTable(tableId);
    if (!table) return;
    table.updateTable(data);
    table.tableChange.emit();
  }

  *getTableSampleList() {
    for (const item of this.getAll()) {
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
export class TableClientAgent extends VioTableBase {
  readonly tableChange = new EventTrigger<void>();
  readonly pageChange = new EventTrigger<typeof this.page>();
  page: { page: number; pageSize: number } = { page: 0, pageSize: Infinity };
}
