import { MaybePromise } from "../../../type.ts";
import { ChartInfo, DimensionalityReduction, IntersectingDimension, RequestUpdateRes } from "./chart.type.ts";

type ChartUpdateCommonData = {
  /** 时间刻度名称 */
  timeAxisName?: string;
  /** 时间刻度(时间戳) */
  timestamp: number;
};
export type ChartUpdateData<T = number> = ChartUpdateCommonData & {
  coord?: undefined;
  data: T;
};
export type ChartUpdateSubData<T = number> =
  | ChartUpdateCommonData
  | {
      coord: number | (number | undefined)[];
      data: IntersectingDimension<T>;
    }
  | { coord: number; data: DimensionalityReduction<T> };

export interface ClientChartExposed {
  /** 在指定图表输出数据 */
  writeChart(chartId: number, data: Readonly<ChartUpdateData<any>>): void;
}
export interface ServerChartExposed {
  /** 获取指定图表的信息 */
  getChartInfo(chartId: number): MaybePromise<ChartInfo | undefined>;
  /** 主动请求更新图 */
  requestUpdateChart(chartId: number): MaybePromise<RequestUpdateRes<any>>;
}
