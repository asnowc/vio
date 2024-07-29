import { VioObject } from "../_object_base.type.ts";

/** @public */
export type VioCell = string | number | null | Tag | Operation;
/** @public */
export type TableRow = { [key: string]: VioCell | VioCell[] };

/** @public */
export interface VioTable<Row extends TableRow = TableRow, Add extends TableRow = Row, Update extends TableRow = Add>
  extends VioObject {
  /** 表格操作事件 */
  onTableAction(operateKey: string, rowKeys: string[]): void;
  /** 行事件 */
  onRowAction(operateKey: string, rowKey: string): void;
  /** 添加行事件 */
  onRowAdd(param: Add): void;
  /** 更新行事件 */
  onRowUpdate(rowKey: string, param: Update): void;

  /** 行数量 */
  rowNumber: number;
  readonly type: "table";
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
  page?: number;
  pageSize?: number;
};

/** @public */
export type TableCreateOption = {
  name?: string;
  /** 表格操作 */
  operations?: Operation[];
  /** 更新操作 */
  updateAction?: boolean;
  /** 新增操作 */
  addAction?: Pick<Operation, "text">;
};
/** @public */
export type Columns<Row extends TableRow = TableRow> = {
  title?: string;
  dataIndex?: keyof Row;
  operations?: Operation[];
  width?: number;

  render?: string;
};
/** @public */
export type TableRenderFn<Row extends TableRow> = (
  record: Row,
  info: {
    index: number;
    page: number;
    pageSize: number;
  },
  column: Readonly<Columns<Row>>,
) => any;

/** @public */
export type Operation = {
  ui: "operation";
  key: string | number;
  icon?: string;
  text?: string;
  type?: string;
  tooltip?: string;

  disable?: boolean;
};

/** @public */
export type Tag = {
  ui: "tag";
  text?: string;
  icon?: string;
  color?: string;
  textColor?: string;
};
