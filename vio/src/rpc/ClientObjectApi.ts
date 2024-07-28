import { CpCall, MakeCallers } from "cpcall";
import type {
  VioClientExposed,
  VioObjectCreateDto,
  ChartUpdateData,
  ClientChartExposed,
  ClientObjectExposed,
  ClientTableExposed,
} from "../vio/api_type.ts";
import { TableRow } from "../vio/mod.ts";

export class ClientObjectApi implements ClientChartExposed, ClientObjectExposed, ClientTableExposed {
  constructor(api: MakeCallers<VioClientExposed>) {
    this.#api = api;
  }
  #api?: MakeCallers<VioClientExposed>;

  createObject(info: VioObjectCreateDto): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.object.createObject, info);
  }
  deleteObject(id: number): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.object.deleteObject, id);
  }

  writeChart(id: number, data: ChartUpdateData<any>): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.chart.writeChart, id, data);
  }
  addRow(tableId: number, param: TableRow, afterIndex: number): void {}
  deleteRow(tableId: number, rowKey: string): void {}
  updateRow(tableId: number, row: TableRow, rowKey: string): void {}
  updateTable(tableId: number, data: TableRow[]): void {}
}
