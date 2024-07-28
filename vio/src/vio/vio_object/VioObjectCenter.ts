import { VioChart as RpcVioChart } from "./chart/VioChart.ts";
import { UniqueKeyMap } from "evlib/data_struct";
import type { VioObject, VioObjectCenter } from "./type.ts";
import type { VioChart, ChartCreateOption } from "./chart/chart.type.ts";
import type { Columns, TableRow, VioTable } from "./table/table.type.ts";
import { ClientObjectExposed } from "./object.dto.ts";
import { ClientChartExposed } from "../api_type.ts";
import { ClientTableExposed } from "./table/table.dto.ts";

export class VioObjectCenterImpl implements VioObjectCenter {
  constructor(private ctrl: ClientObjectExposed & ClientChartExposed & ClientTableExposed) {}
  defaultChartCacheSize = 20;
  #instanceMap = new UniqueKeyMap<VioObject>(2 ** 32);

  getObject(objectId: number): VioObject | undefined {
    return this.#instanceMap.get(objectId);
  }

  /** 获取所有已 Vio 对象*/
  getAll(): IterableIterator<VioObject> {
    return this.#instanceMap.values();
  }
  /** 所有 Vio 对象数量 */
  get chartsNumber(): number {
    return this.#instanceMap.size;
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

  get(chartId: number): VioChart | undefined {
    const obj = this.#instanceMap.get(chartId);
    if (obj instanceof RpcVioChart) {
      return obj;
    }
  }
  create = this.createChart;
  disposeChart = this.disposeObject;
}
export interface VioObjectCenterImpl {
  createTable<T extends TableRow>(columns: Columns<T>[]): VioTable;
}
