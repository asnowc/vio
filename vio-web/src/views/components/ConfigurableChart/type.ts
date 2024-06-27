import { EChartsPruneOption, EChartsPruneSeries } from "@/lib/echarts.ts";
import { VioChartMeta } from "@asnc/vio/client";

export interface ChartCommonProps<T> {
  resizeDep?: any[];
  data: T;
  chartMeta: VioChartMeta;
  chartType: string;
  dimensionIndexNames?: Record<number, (string | undefined)[] | undefined>;
  dimensionNames?: Record<number, string | undefined>;
  staticOptions?: EChartsPruneOption;
  staticSeries?: EChartsPruneSeries;
}
