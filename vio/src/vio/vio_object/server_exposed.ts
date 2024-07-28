import { indexRecordToArray } from "../../lib/array_like.ts";
import { MaybePromise } from "../../type.ts";
import { ServerChartExposed } from "./chart/chart.dto.ts";
import { ChartDataItem, ChartInfo, RequestUpdateRes, VioChart } from "./chart/chart.type.ts";
import { VioChart as RpcVioChart } from "./chart/VioChart.ts";
import { ServerObjectExposed, VioObjectDto } from "./object.dto.ts";
import { ServerTableExposed } from "./table/table.dto.ts";
import { TableFilter, TableRow, VioObjectCenter } from "./type.ts";

import { VioObjectCenterImpl } from "./VioObjectCenter.ts";

export class RpcServerChartExposed implements ServerChartExposed {
  constructor(api: VioObjectCenterImpl) {
    this.#chart = api;
  }
  #chart: VioObjectCenterImpl;
  #getChart(id: number) {
    const chart = this.#chart.getObject(id);
    if (chart instanceof RpcVioChart) return chart;
  }
  getChartInfo(id: number): ChartInfo<any> | undefined {
    const chart = this.#getChart(id);
    if (!chart) return;
    return RpcServerChartExposed.getChartInfo(chart, id);
  }
  requestUpdateChart<T>(chartId: number): MaybePromise<RequestUpdateRes<T>> {
    const chart = this.#getChart(chartId);
    if (!chart) throw new Error(`The id ${chartId} is not a Chart`);
    return chart.requestUpdate() as MaybePromise<RequestUpdateRes<T>>;
  }
  private static getChartInfo<T>(chart: VioChart<T>, id: number): ChartInfo<T> {
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
}
export class RpcServerObjectExposed implements ServerObjectExposed {
  constructor(api: VioObjectCenter) {
    this.#chart = api;
  }
  #chart: VioObjectCenter;
  getObjects(): { list: VioObjectDto[] } {
    const list = new Array<VioObjectDto>(this.#chart.chartsNumber);
    let i = 0;
    for (const item of this.#chart.getAll()) {
      list[i++] = { id: item.id, type: item.type, name: item.name };
    }
    return { list };
  }
}
//TODO table
export class RpcServerTableExposed implements ServerTableExposed {
  constructor(center: VioObjectCenter) {
    this.#object = center;
  }
  #object: VioObjectCenter;
  getData(filter?: TableFilter): TableRow[] {
    throw new Error("未实现");
  }
  onAction(operateKey: string, rowKeys: string[]): void {
    throw new Error("未实现");
  }
  onRowAction(operateKey: string, rowKey: string): void {
    throw new Error("未实现");
  }
  onRowAdd(param: TableRow): void {
    throw new Error("未实现");
  }
  onRowUpdate(rowKey: string, param: TableRow): void {
    throw new Error("未实现");
  }
}
