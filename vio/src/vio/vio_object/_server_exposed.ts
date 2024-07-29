import { indexRecordToArray } from "../../lib/array_like.ts";
import { MaybePromise } from "../../type.ts";
import { VioChart as RpcVioChart } from "./chart/VioChart.ts";
import { VioTableImpl } from "./table/VioTable.ts";
import { ServerObjectExposed, TableDataDto, VioObjectDto, VioTableDto } from "./object.dto.ts";
import { TableFilter, TableRow, ChartDataItem, ChartInfo, RequestUpdateRes, VioChart } from "./object.type.ts";

import { VioObjectCenterImpl } from "./_VioObjectCenter.ts";

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

  /* Chart */

  #getChart(id: number): RpcVioChart<unknown> {
    const chart = this.#center.getObject(id);
    if (chart instanceof RpcVioChart) return chart;
    throw new Error(`Chart ${id} does not exist`);
  }
  getChartInfo(id: number): ChartInfo<any> {
    const chart = this.#getChart(id);
    return getChartInfo(chart, id);
  }
  requestUpdateChart<T>(chartId: number): MaybePromise<RequestUpdateRes<T>> {
    const chart = this.#getChart(chartId);
    return chart.requestUpdate() as MaybePromise<RequestUpdateRes<T>>;
  }

  /* Table */
  #getTable(id: number): VioTableImpl {
    const object = this.#center.getObject(id);
    if (object instanceof VioTableImpl) return object;
    throw new Error(`Table ${id} does not exist`);
  }
  getTable(id: number): VioTableDto {
    const table = this.#getTable(id);
    return { columns: table.columns, ...table.config, id: table.id };
  }
  getTableData(tableId: number, filter?: TableFilter): TableDataDto<TableRow> {
    const table = this.#getTable(tableId);
    return table.getRows(filter);
  }
  onTableAction(tableId: number, operateKey: string, rowKeys: string[]): void {
    this.#getTable(tableId).onTableAction(operateKey, rowKeys);
  }
  onTableRowAction(tableId: number, operateKey: string, rowKey: string): void {
    this.#getTable(tableId).onRowAction(operateKey, rowKey);
  }
  onTableRowAdd(tableId: number, param: TableRow): void {
    this.#getTable(tableId).onRowAdd(param);
  }
  onTableRowUpdate(tableId: number, rowKey: string, param: TableRow): void {
    this.#getTable(tableId).onRowUpdate(rowKey, param);
  }
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
