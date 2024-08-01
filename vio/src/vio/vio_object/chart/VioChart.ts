import { deepClone } from "evlib";
import {
  ChartCreateOption,
  ChartUpdateLowerOption,
  ChartUpdateOption,
  DimensionalityReduction,
  IntersectingDimension,
} from "./chart.type.ts";
import { VioChartBase } from "./VioChartBase.ts";
import { ChartUpdateData, ChartUpdateSubData, ClientChartExposed } from "./chart.dto.ts";
import { ClientObjectBaseExposed } from "../_object_base.dto.ts";

export class VioChart<T> extends VioChartBase<T> {
  constructor(
    ctrl: ClientChartExposed & ClientObjectBaseExposed,
    chartId: number,
    dimension: number,
    options: ChartCreateOption<T> = {},
  ) {
    super({
      ...options,
      id: chartId,
      dimension,
    });
    this.#ctrl = ctrl;
  }

  #ctrl?: ClientChartExposed & ClientObjectBaseExposed;
  /** @override */
  updateData(data: T, timeName?: string): void {
    if (!this.#ctrl) return;
    let internalData = typeof data === "object" ? deepClone(data) : data;

    const timestamp = Date.now();
    this.pushCache({ data: internalData, timestamp, timeName });

    const writeData: ChartUpdateData<any> = { data: internalData, timestamp: timestamp, timeAxisName: timeName };
    this.#ctrl.writeChart(this.id, writeData);
  }
  updateSubData(updateData: DimensionalityReduction<T>, coord: number, opts?: ChartUpdateLowerOption): void;
  updateSubData(updateData: IntersectingDimension<T>, coord: (number | undefined)[], opts?: ChartUpdateOption): void;
  /** @override */
  updateSubData(
    updateData: IntersectingDimension<T>,
    coord: number | (number | undefined)[],
    opts?: ChartUpdateLowerOption | ChartUpdateOption,
  ): void {
    if (!this.#ctrl) return;
    const timestamp = Date.now();
    this.#ctrl.writeChart(this.id, {
      data: updateData,
      coord: coord as any,
      timeAxisName: opts?.timeName,
      timestamp: timestamp,
    } satisfies ChartUpdateSubData<T>);
    if (this.maxCacheSize <= 0) return;
    //@ts-ignore
    super.updateSubData(updateData, coord, opts);
  }
  get disposed() {
    return !this.#ctrl;
  }
  dispose() {
    if (!this.#ctrl) return;
    this.#ctrl.deleteObject(this.id);
    this.#ctrl = undefined;
  }
}
