import { CpCall, MakeCallers } from "cpcall";
import type {
  VioClientExposed,
  VioObjectCreateDto,
  ChartUpdateData,
  ClientObjectExposed,
  TableChanges,
} from "../vio/api_type.ts";
import { Key, TableRow } from "../vio/mod.ts";

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
