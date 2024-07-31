import { MaybePromise } from "../../../type.ts";
import { Column, Key, TableFilter, TableRow } from "./table.type.ts";
import { UiAction, UiButton } from "../_ui/mod.ts";

export type VioTableDto = {
  id: number;
  name?: string;

  keyField: string;
  columns: ColumnDto[];
  operations?: UiAction[];
  rowOperation?: UiAction[];
  updateAction?: boolean;
  addAction?: UiButton["props"];
};
export type TableDataDto<Row extends TableRow> = {
  rows: Row[];
  index: number[];
  total: number;
};
export type ColumnDto = Pick<Column, "title" | "dataIndex" | "width"> & {};

export interface ViewTable<Row extends TableRow> extends ClientTableExposed<Row> {
  rows: Row[];
  pageIndex: number;
  pageSize: number;
  loading: boolean;
  readonly columns: Column;

  /** 行数量 */
  rowNumber: number;
}
export interface ServerTableExposed<
  Row extends TableRow = TableRow,
  Add extends TableRow = Row,
  Update extends TableRow = Add,
> {
  /** 表格操作事件 */
  onTableAction(tableId: number, operateKey: string, rowKeys: Key[]): void;
  /** 行事件 */
  onTableRowAction(tableId: number, operateKey: string, rowKey: Key): void;
  /** 添加行事件 */
  onTableRowAdd(tableId: number, param: Add): void;
  /** 更新行事件 */
  onTableRowUpdate(tableId: number, rowKey: Key, param: Update): void;

  getTableData(tableId: number, filter?: TableFilter): MaybePromise<TableDataDto<Row>>;
  getTable(id: number): MaybePromise<VioTableDto>;
}

export interface ClientTableExposed<Row extends TableRow = TableRow> {
  tableChange(tableId: number, changes: TableChanges<Row>): void;
  updateTable(tableId: number): void;
}
export type TableChanges<Row extends TableRow = TableRow> = { update?: Row[]; delete?: Key[]; add?: Row[] };
