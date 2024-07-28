import { MaybePromise } from "../../../type.ts";
import { Columns, Operation, TableFilter, TableRow } from "./table.type.ts";

export type VioTableDto<T extends TableRow> = { columns: ColumnDto[]; data: T[]; operations: Operation[] };
export type ColumnDto = Pick<Columns, "title" | "dataIndex" | "width" | "operations"> & {};

export interface ViewTable<Row extends TableRow> extends ClientTableExposed<Row> {
  rows: Row[];
  pageIndex: number;
  pageSize: number;
  loading: boolean;
  readonly columns: Columns;

  /** 行数量 */
  rowNumber: number;
}
export interface ServerTableExposed<
  Row extends TableRow = TableRow,
  Add extends TableRow = Row,
  Update extends TableRow = Add,
> {
  /** 表格操作事件 */
  onAction(operateKey: string, rowKeys: string[]): void;
  /** 行事件 */
  onRowAction(operateKey: string, rowKey: string): void;
  /** 添加行事件 */
  onRowAdd(param: Add): void;
  /** 更新行事件 */
  onRowUpdate(rowKey: string, param: Update): void;

  getData(filter?: TableFilter): MaybePromise<Row[]>;
}

export interface ClientTableExposed<Row extends TableRow = TableRow> {
  addRow(tableId: number, param: Row, afterIndex: number): void;
  deleteRow(tableId: number, rowKey: string): void;
  updateRow(tableId: number, row: Row, rowKey: string): void;
  updateTable(tableId: number, data: Row[]): void;
}
