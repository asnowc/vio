import { TableCreateOption, Column, TableRow, TableFilter, Key } from "./table.type.ts";
import { TableDataDto } from "./table.dto.ts";
import { removeUndefinedKey } from "evlib";

export class VioTableBase<Row extends TableRow = TableRow> {
  constructor(id: number, columns: Readonly<Column<Row>>[], option: TableCreateOption) {
    this.id = id;
    if (typeof option.keyField !== "string") throw new Error("option.keyField must be a string");
    this.config = {
      keyField: option.keyField,
      addAction: option.addAction,
      name: option.name,
      operations: option.operations,
      updateAction: option.updateAction,
    };
    removeUndefinedKey(this.config);

    this.columns = columns.map((item): Column => {
      const columns: Column = {
        dataIndex: item.dataIndex as string,
        title: item.title,
        width: item.width,
        render: item.render,
      };
      removeUndefinedKey(columns);
      return columns;
    });
  }
  readonly config: Readonly<TableCreateOption>;
  readonly columns: Readonly<Column>[];
  readonly type = "table";
  id: number;
  get name() {
    return this.config.name;
  }
  get rowNumber() {
    return this.#data.length;
  }
  #data: Row[] = [];
  get data(): Row[] {
    return this.#data;
  }

  getRow(index: number): Row {
    return this.data[index];
  }
  getRowIndexByKey(key: Key) {
    const keyField = this.config.keyField;
    return this.data.findIndex((item) => item[keyField] === key);
  }
  updateRow(row: Row, index: number): void {
    const oldRow = this.#data[index];
    if (!oldRow) throw new RangeError(`Index '${index}' exceeds the range of the table`);
    this.#data[index] = row;
  }
  updateTable(data: Row[]): void {
    this.#data = data;
  }
  addRow(row: Row, index?: number): void {
    const arr = this.#data;
    if (index === undefined || index === arr.length) {
      arr.push(row);
    } else {
      if (index < 0 || index > arr.length) throw new RangeError(`invalid index '${index}'`);
      let i = arr.length;
      while (i > index) {
        arr[i] = arr[--i];
      }
      arr[i] = row;
    }
  }
  deleteRow(index: number, count = 1): Row[] {
    return this.#data.splice(index, count);
  }
  getRows(filter: TableFilter = {}): TableDataDto<Row> {
    let { skip = 0, number = Infinity } = filter;
    const res: Row[] = [];
    const index: number[] = [];
    const arr = this.#data;
    while (skip < arr.length && res.length < number) {
      let idx = skip++;
      res.push(arr[idx]);
      index.push(idx);
    }
    return { rows: res, index, total: this.rowNumber };
  }
}
