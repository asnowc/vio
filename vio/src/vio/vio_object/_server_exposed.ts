import { ChartUpdateData, ClientObjectExposed, TableChanges, VioObjectCreateDto } from "./object.dto.ts";
import { TableRow } from "./object.type.ts";

import { VioClientExposed } from "../api_type.ts";
import { CpCall, MakeCallers } from "cpcall";

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

  updateTable(tableId: number): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.updateTable, tableId);
  }
  tableChange(tableId: number, changes: TableChanges<TableRow>): void {
    if (!this.#api) return;
    CpCall.exec(this.#api.tableChange, tableId, changes);
  }
}
