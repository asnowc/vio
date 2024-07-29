import { MaybePromise } from "../../../type.ts";
import { Columns, Operation, TableFilter, TableRow } from "./table.type.ts";

export type VioTableDto = {
  id: number;
  columns: ColumnDto[];
  operations?: Operation[];
  updateAction?: boolean;

  name?: string;
  addAction?: Pick<Operation, "text">;
};
export type TableDataDto<Row extends TableRow> = {
  rows: Row[];
  index: number[];
};
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
  onTableAction(tableId: number, operateKey: string, rowKeys: string[]): void;
  /** 行事件 */
  onTableRowAction(tableId: number, operateKey: string, rowKey: string): void;
  /** 添加行事件 */
  onTableRowAdd(tableId: number, param: Add): void;
  /** 更新行事件 */
  onTableRowUpdate(tableId: number, rowKey: string, param: Update): void;

  getTableData(tableId: number, filter?: TableFilter): MaybePromise<TableDataDto<Row>>;
  getTable(id: number): MaybePromise<VioTableDto>;
}

export interface ClientTableExposed<Row extends TableRow = TableRow> {
  addTableRow(tableId: number, param: Row, afterIndex: number): void;
  deleteTableRow(tableId: number, index: number, number: number): void;
  updateTableRow(tableId: number, row: Row, index: number): void;
  updateTable(tableId: number, data: Row[]): void;
}
