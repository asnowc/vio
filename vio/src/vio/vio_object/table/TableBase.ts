import { TableCreateOption, Columns, TableRow, TableFilter } from "./table.type.ts";
import { pickObjectKey, removeUndefinedKey } from "evlib";

export class VioTableBase<Row extends TableRow = TableRow> {
  constructor(id: number, columns: Readonly<Columns<Row>>[], option: TableCreateOption) {
    this.id = id;
    this.config = {
      addAction: option.addAction,
      name: option.name,
      operations: option.operations,
      updateAction: option.updateAction,
    };
    removeUndefinedKey(this.config);

    this.columns = columns.map((item): Columns => {
      const columns: Columns = {
        dataIndex: item.dataIndex as string,
        title: item.title,
        width: item.width,
        render: item.render,
        operations: item.operations?.map((item) => {
          return pickObjectKey(item, ["disable", "icon", "key", "text", "tooltip", "type", "ui"]);
        }),
      };
      removeUndefinedKey(columns);
      return columns;
    });
  }
  readonly config: Readonly<TableCreateOption>;
  readonly columns: Readonly<Columns>[];
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
  getRows(filter: TableFilter = {}): { rows: Row[]; index: number[] } {
    let { page = 0, pageSize = Infinity } = filter;
    const res: Row[] = [];
    const index: number[] = [];
    const arr = this.#data;
    while (page < arr.length && res.length < pageSize) {
      let idx = page++;
      res.push(arr[idx]);
      index.push(idx);
    }
    return { rows: res, index };
  }
}
