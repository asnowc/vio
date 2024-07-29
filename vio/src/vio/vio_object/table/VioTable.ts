import { ClientTableExposed } from "./table.dto.ts";
import { VioTable, TableCreateOption, Columns, TableRow } from "./table.type.ts";
import { VioTableBase } from "./TableBase.ts";

export class VioTableImpl<Row extends TableRow = TableRow, Add extends TableRow = Row, Update extends TableRow = Add>
  extends VioTableBase<Row>
  implements VioTable<Row, Add, Update>
{
  constructor(ctrl: ClientTableExposed, id: number, columns: Readonly<Columns<Row>>[], option: TableCreateOption) {
    super(id, columns, option);
    this.#ctrl = ctrl;
  }
  #ctrl: ClientTableExposed;

  updateRow(row: Row, index: number): void {
    super.updateRow(row, index);
    this.#ctrl.updateTableRow(this.id, row, index);
  }
  updateTable(data: Row[]): void {
    super.updateTable(data);
    this.#ctrl.updateTable(this.id, data);
  }

  addRow(row: Row, index: number = this.data.length): void {
    super.addRow(row, index);
    this.#ctrl.addTableRow(this.id, row, index);
  }
  deleteRow(index: number, count = 1): Row[] {
    const deleted = super.deleteRow(index, count);
    this.#ctrl.deleteTableRow(this.id, index, count);
    return deleted;
  }

  onTableAction(operateKey: string, rowKeys: string[]): void {}
  onRowAdd(param: Add): void {}
  onRowAction(operateKey: string, rowKey: string): void {}
  onRowUpdate(rowKey: string, param: Update): void {}
}
