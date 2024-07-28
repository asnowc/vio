import { EChartsPruneOption, EChartsPruneSeries } from "@/lib/echarts.ts";
import { ChartDataItem, ChartMeta, DimensionInfo } from "@asla/vio";

export interface ChartCommonProps<T> {
  resizeDep?: any[];
  dataList: Readonly<ChartDataItem<T>>[];
  chartMeta: ChartConfig;
  dimension: number;
  dimensions: ArrayLike<DimensionInfo>;
  staticOptions?: EChartsPruneOption;
  staticSeries?: EChartsPruneSeries;
}
export interface ChartConfig extends ChartMeta.Common {
  chartType?: string;
  echartsOption?: object;
  echartsSeries?: object;
  requestUpdate?: boolean;
  enableTimeline?: boolean;
}
