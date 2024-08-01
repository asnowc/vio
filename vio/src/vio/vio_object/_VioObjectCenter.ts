import { VioChart as RpcVioChart } from "./chart/VioChart.ts";
import { VioTableImpl } from "./table/VioTable.ts";
import { UniqueKeyMap } from "evlib/data_struct";
import type { VioChart, ChartCreateOption } from "./chart/chart.type.ts";
import type { Column, TableCreateOption, TableRow, VioTable } from "./table/table.type.ts";
import type { VioObjectCenter, VioObject } from "./object.type.ts";
import type { ClientObjectExposed } from "./object.dto.ts";

export class VioObjectCenterImpl implements VioObjectCenter {
  constructor(private ctrl: ClientObjectExposed) {}
  defaultChartCacheSize = 20;
  #instanceMap = new UniqueKeyMap<VioObject>(2 ** 32);

  getObject(objectId: number): VioObject | undefined {
    return this.#instanceMap.get(objectId);
  }

  /** 获取所有已 Vio 对象*/
  getAll(): IterableIterator<VioObject> {
    return this.#instanceMap.values();
  }
  /**
   * 所有 Vio 对象数量
   * @deprecated 已废弃
   */
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
  createTable<T extends TableRow>(columns: Column<T>[], option: TableCreateOption): VioTable<T> {
    let chartId = this.#instanceMap.allocKeySet(null as any);
    const instance = new VioTableImpl<T>(this.ctrl, chartId, columns, option);
    this.#instanceMap.set(chartId, instance);
    this.ctrl.createObject({ id: chartId, name: instance.name, type: instance.type });
    return instance;
  }

  /** @deprecated 已废弃 */
  get(chartId: number): VioChart | undefined {
    const obj = this.#instanceMap.get(chartId);
    if (obj instanceof RpcVioChart) {
      return obj;
    }
  }
  create = this.createChart;
  disposeChart = this.disposeObject;
}
