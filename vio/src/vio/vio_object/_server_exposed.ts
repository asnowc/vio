import { indexRecordToArray } from "../../lib/array_like.ts";
import { MaybePromise } from "../../type.ts";
import { VioChart as RpcVioChart } from "./chart/VioChart.ts";
import { VioTableImpl } from "./table/VioTable.ts";
import { ServerObjectExposed, TableDataDto, VioObjectDto, VioTableDto } from "./object.dto.ts";
import { TableFilter, TableRow, ChartDataItem, ChartInfo, RequestUpdateRes, VioChart, Key } from "./object.type.ts";

import { VioObjectCenterImpl } from "./_VioObjectCenter.ts";
import { DebugCommand, VioStepTask } from "./step_runner/mod.private.ts";

export class RpcServerObjectExposed implements ServerObjectExposed {
  constructor(objectCenter: VioObjectCenterImpl) {
    this.#center = objectCenter;
  }
  #center: VioObjectCenterImpl;

  getObjects(): { list: VioObjectDto[] } {
    const list = new Array<VioObjectDto>(this.#center.chartsNumber);
    let i = 0;
    for (const item of this.#center.getAll()) {
      list[i++] = { id: item.id, type: item.type, name: item.name };
    }
    return { list };
  }

  #getObject<T extends new (...args: any[]) => any>(id: number, type: T, name: string): InstanceType<T> {
    const object = this.#center.getObject(id);
    if (object instanceof type) return object as any;
    throw new Error(`${name} ${id} does not exist`);
  }
  /* Chart */
  getChartInfo(id: number): ChartInfo<any> {
    const chart = this.#getObject(id, RpcVioChart, "Chart");
    return getChartInfo(chart, id);
  }
  requestUpdateChart<T>(chartId: number): MaybePromise<RequestUpdateRes<T>> {
    const chart = this.#getObject(chartId, RpcVioChart, "Chart");
    return chart.requestUpdate() as MaybePromise<RequestUpdateRes<T>>;
  }

  /* Table */
  getTable(id: number): VioTableDto {
    const table = this.#getObject(id, VioTableImpl, "Table");
    return { columns: table.columns, ...table.config, id: table.id };
  }
  getTableData(tableId: number, filter?: TableFilter): TableDataDto<TableRow> {
    const table = this.#getObject(tableId, VioTableImpl, "Table");
    return table.getRows(filter);
  }
  onTableAction(tableId: number, operateKey: string, rowKeys: string[]): void {
    this.#getObject(tableId, VioTableImpl, "Table").onTableAction(operateKey, rowKeys);
  }
  onTableRowAction(tableId: number, operateKey: string, rowKey: Key): void {
    isKey(rowKey);
    this.#getObject(tableId, VioTableImpl, "Table").onRowAction(operateKey, rowKey);
  }
  onTableRowAdd(tableId: number, param: TableRow): void {
    this.#getObject(tableId, VioTableImpl, "Table").onRowAdd(param);
  }
  onTableRowUpdate(tableId: number, rowKey: string, param: TableRow): void {
    isKey(rowKey);
    this.#getObject(tableId, VioTableImpl, "Table").onRowUpdate(rowKey, param);
  }

  /* StepTask */
  execStepTaskCommand(objId: number, command: DebugCommand): void {
    const stepTask = this.#getObject(objId, VioStepTask, "StepTask");
    stepTask.execCommand(command);
  }
  getStepTaskCommand(objId: number): { list: any[]; paused: boolean } {
    const stepTask = this.#getObject(objId, VioStepTask, "StepTask");
    return { list: stepTask.getStack(), paused: stepTask.paused };
  }
}
function isKey(key: Key) {
  let type = typeof key;
  if (type === "string" || type == "number") return;
  throw new Error("rowKey must be a string or number:" + typeof key);
}
function getChartInfo<T>(chart: VioChart<T>, id: number): ChartInfo<T> {
  const cacheList: ChartDataItem<T>[] = new Array(chart.cachedSize);
  let i = 0;
  for (const item of chart.getCacheDateItem()) {
    let dataItem: ChartDataItem<T> = { data: item.data, timestamp: item.timestamp };
    if (item.timeName) dataItem.timeName = item.timeName;
    cacheList[i++] = dataItem;
  }
  return {
    name: chart.name,
    meta: chart.meta,
    dimension: chart.dimension,
    id,
    cacheList,
    dimensions: indexRecordToArray(chart.dimensions),
  };
}
