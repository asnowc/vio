import { VioChart as RpcVioChart } from "./chart/VioChart.ts";
import { VioTableImpl } from "./table/VioTable.ts";
import { UniqueKeyMap } from "evlib/data_struct";
import type { VioChart, ChartCreateOption, ChartInfo, ChartDataItem, RequestUpdateRes } from "./chart/chart.type.ts";
import type { Column, Key, TableCreateOption, TableFilter, TableRow, VioTable } from "./table/table.type.ts";
import type { VioObjectCenter, VioObject } from "./object.type.ts";
import type {
  ClientObjectExposed,
  ServerObjectExposed,
  TableDataDto,
  VioObjectDto,
  VioTableDto,
} from "./object.dto.ts";
import { MaybePromise } from "../../type.ts";
import { indexRecordToArray } from "../../lib/array_like.ts";
import { RpcService, RpcExposed } from "cpcall";

@RpcService()
export class VioObjectCenterImpl implements VioObjectCenter, ServerObjectExposed {
  constructor(private ctrl: ClientObjectExposed) {}
  defaultChartCacheSize = 20;
  #instanceMap = new UniqueKeyMap<VioObject>(2 ** 32);
  /**
   * 所有 Vio 对象数量
   */
  get chartsNumber(): number {
    return this.#instanceMap.size;
  }
  getObject(objectId: number): VioObject | undefined {
    return this.#instanceMap.get(objectId);
  }
  /** 获取所有已 Vio 对象*/
  getAll(): IterableIterator<VioObject> {
    return this.#instanceMap.values();
  }
  disposeObject(chart: VioObject) {
    if (chart instanceof RpcVioChart) {
      chart.dispose();
    } else {
      throw new Error("This chart does not belong to the center");
    }
    this.#instanceMap.delete(chart.id);
  }
  createChart(dimension: number, options?: ChartCreateOption<any>): VioChart<any> {
    let chartId = this.#instanceMap.allocKeySet(null as any);
    const chart = new RpcVioChart(this.ctrl, chartId, dimension, {
      ...options,
      maxCacheSize: options?.maxCacheSize ?? this.defaultChartCacheSize,
    });
    this.#instanceMap.set(chartId, chart);
    this.ctrl.createObject({ id: chartId, name: chart.name, type: chart.type });

    return chart;
  }
  createTable<T extends TableRow>(columns: Column<T>[], option: TableCreateOption): VioTable<T> {
    let chartId = this.#instanceMap.allocKeySet(null as any);
    const instance = new VioTableImpl<T>(this.ctrl, chartId, columns, option);
    this.#instanceMap.set(chartId, instance);
    this.ctrl.createObject({ id: chartId, name: instance.name, type: instance.type });
    return instance;
  }

  // ServerObjectExposed
  @RpcExposed()
  getObjects(): { list: VioObjectDto[] } {
    const list = new Array<VioObjectDto>(this.chartsNumber);
    let i = 0;
    for (const item of this.getAll()) {
      list[i++] = { id: item.id, type: item.type, name: item.name };
    }
    return { list };
  }

  /* Chart */
  #getChart(id: number): RpcVioChart<unknown> {
    const chart = this.getObject(id);
    if (chart instanceof RpcVioChart) return chart;
    throw new Error(`Chart ${id} does not exist`);
  }
  @RpcExposed()
  getChartInfo(id: number): ChartInfo<any> {
    const chart = this.#getChart(id);
    return getChartInfo(chart, id);
  }
  @RpcExposed()
  requestUpdateChart<T>(chartId: number): MaybePromise<RequestUpdateRes<T>> {
    const chart = this.#getChart(chartId);
    return chart.requestUpdate() as MaybePromise<RequestUpdateRes<T>>;
  }

  /* Table */
  #getTable(id: number): VioTableImpl {
    const object = this.getObject(id);
    if (object instanceof VioTableImpl) return object;
    throw new Error(`Table ${id} does not exist`);
  }
  @RpcExposed()
  getTable(id: number): VioTableDto {
    const table = this.#getTable(id);
    return { columns: table.columns, ...table.config, id: table.id };
  }
  @RpcExposed()
  getTableData(tableId: number, filter?: TableFilter): TableDataDto<TableRow> {
    const table = this.#getTable(tableId);
    return table.getRows(filter);
  }
  @RpcExposed()
  onTableAction(tableId: number, operateKey: string, rowKeys: string[]): void {
    this.#getTable(tableId).onTableAction(operateKey, rowKeys);
  }
  @RpcExposed()
  onTableRowAction(tableId: number, operateKey: string, rowKey: Key): void {
    isKey(rowKey);
    this.#getTable(tableId).onRowAction(operateKey, rowKey);
  }
  @RpcExposed()
  onTableRowAdd(tableId: number, param: TableRow): void {
    this.#getTable(tableId).onRowAdd(param);
  }
  @RpcExposed()
  onTableRowUpdate(tableId: number, rowKey: string, param: TableRow): void {
    isKey(rowKey);
    this.#getTable(tableId).onRowUpdate(rowKey, param);
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
