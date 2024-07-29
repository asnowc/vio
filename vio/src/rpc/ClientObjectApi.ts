import { CpCall, MakeCallers } from "cpcall";
import type { VioClientExposed, VioObjectCreateDto, ChartUpdateData, ClientObjectExposed } from "../vio/api_type.ts";
import { TableRow } from "../vio/mod.ts";

export class ClientObjectApi implements ClientObjectExposed {
  constructor(api: MakeCallers<VioClientExposed>) {
    this.#api = api.object;
  }
  #api?: MakeCallers<ClientObjectExposed>;
  createObject(info: VioObjectCreateDto): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.createObject, info);
  }
  deleteObject(id: number): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.deleteObject, id);
  }

  writeChart(id: number, data: ChartUpdateData<any>): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.writeChart, id, data);
  }

  addTableRow(tableId: number, param: TableRow, afterIndex: number): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.addTableRow, tableId, param, afterIndex);
  }
  deleteTableRow(tableId: number, index: number, count: number): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.deleteTableRow, tableId, index, count);
  }
  updateTableRow(tableId: number, row: TableRow, index: number): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.updateTableRow, tableId, row, index);
  }
  updateTable(tableId: number, data: TableRow[]): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.updateTable, tableId, data);
  }
}
