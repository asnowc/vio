import { VioObject } from "../_object_base.type.ts";
import { UiAction, UiButton, UiBase } from "../_ui/mod.ts";

/** @public */
export type TableRow = { [key: string]: any };

/** @public */
export interface VioTable<Row extends TableRow = TableRow, Add extends TableRow = Row, Update extends TableRow = Add>
  extends VioObject {
  /** 表格操作事件 */
  onTableAction(operateKey: string, rowKeys: Key[]): void;
  /** 行事件 */
  onRowAction(operateKey: string, rowKey: Key): void;
  /** 添加行事件 */
  onRowAdd(param: Add): void;
  /** 更新行事件 */
  onRowUpdate(rowKey: string, param: Update): void;

  /** 行数量 */
  rowNumber: number;
  readonly type: "table";
  getRowIndexByKey(key: Key): number;
  getRow(index: number): Row;
  /** 更新表格数据 */
  updateTable(data: Row[]): void;
  updateRow(row: Row, index: number): void;
  /** 添加表格行 */
  addRow(row: Row, afterIndex?: number): void;
  /** 删除表格行 */
  deleteRow(index: number, count: number): void;

  getRows(filter?: TableFilter): { rows: Row[]; index: number[] };
}
/** @public */
export type TableFilter = {
  skip?: number;
  number?: number;
};

/** @public */
export type TableCreateOption = {
  keyField: string;
  name?: string;
  /** 表格操作 */
  operations?: UiAction[];
  /** 更新操作 */
  updateAction?: boolean;
  /** 新增操作 */
  addAction?: UiButton["props"];
};
/** @public */
export type Column<Row extends TableRow = TableRow> = {
  title?: string;
  dataIndex?: keyof Row;
  width?: number;
  render?: string;
};
/** @public */
export type TableRenderFn<Row extends TableRow> = (args: {
  record: Row;
  index: number;
  column: Readonly<Column<Row>>;
}) => UiBase | UiBase[];

/** @public */
export type Key = string | number;
