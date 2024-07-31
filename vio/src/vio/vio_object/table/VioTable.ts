import { ClientTableExposed, TableChanges } from "./table.dto.ts";
import { VioTable, TableCreateOption, Column, TableRow, Key } from "./table.type.ts";
import { VioTableBase } from "./TableBase.ts";

export class VioTableImpl<Row extends TableRow = TableRow, Add extends TableRow = Row, Update extends TableRow = Add>
  extends VioTableBase<Row>
  implements VioTable<Row, Add, Update>
{
  constructor(ctrl: ClientTableExposed, id: number, columns: Readonly<Column<Row>>[], option: TableCreateOption) {
    super(id, columns, option);
    this.#ctrl = ctrl;
  }
  #ctrl: ClientTableExposed;
  updateRow(row: Row, index: number): void {
    const oldRow = this.data[index];
    super.updateRow(row, index);
    const keyField = this.config.keyField;

    const key = oldRow[keyField];
    const newKey = row[keyField];

    if (key === newKey) {
      if (this.#addMerge.has(key)) this.#addMerge.set(key, row);
      else this.#updateMerge.set(key, row);
    } else {
      if (this.#addMerge.has(key)) {
        this.#addMerge.delete(key);
        this.#addMerge.set(newKey, row);
      } else {
        this.#deleteMerge.add(key);
        this.#addMerge.set(newKey, row);
      }
    }
    this.#check();
  }
  addRow(row: Row, index: number = this.data.length): void {
    super.addRow(row, index);
    const key = row[this.config.keyField];
    if (this.#deleteMerge.has(key)) this.#deleteMerge.delete(key);
    this.#addMerge.set(key, row);
    this.#check();
  }
  deleteRow(index: number, count = 1): Row[] {
    const deleted = super.deleteRow(index, count);
    const keyField = this.config.keyField;

    for (const item of deleted) {
      let key = item[keyField];
      if (this.#addMerge.has(key)) this.#addMerge.delete(key);
      else {
        if (this.#updateMerge.has(key)) this.#updateMerge.delete(key);
        this.#deleteMerge.add(key);
      }
    }
    this.#check();
    return deleted;
  }
  updateTable(data: Row[]): void {
    super.updateTable(data);
    this.#skipUpdate();
    this.#ctrl.updateTable(this.id);
  }

  onTableAction(operateKey: string, rowKeys: Key[]): void {}
  onRowAdd(param: Add): void {}
  onRowAction(operateKey: string, rowKey: Key): void {}
  onRowUpdate(rowKey: string, param: Update): void {}

  /* 合并发送 */

  #deleteMerge: Set<Key> = new Set();
  #addMerge = new Map<Key, Row>();
  #updateMerge = new Map<Key, Row>();
  #timer?: number;
  #skipUpdate() {
    clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#deleteMerge.clear();
    this.#addMerge.clear();
    this.#updateMerge.clear();
  }
  #check() {
    if (this.#timer === undefined) {
      this.#timer = setTimeout(this.#send, 33) as any;
    }
  }
  #send = () => {
    const changes: TableChanges = {};
    if (this.#addMerge.size) {
      changes.add = Array.from(this.#addMerge.values());
      this.#addMerge.clear();
    }
    if (this.#deleteMerge.size) {
      changes.delete = Array.from(this.#deleteMerge);
      this.#deleteMerge.clear();
    }

    if (this.#updateMerge.size) {
      changes.update = Array.from(this.#updateMerge.values());
      this.#updateMerge.clear();
    }
    this.#ctrl.tableChange(this.id, changes);
    this.#timer = undefined;
  };
}
