import { use, ComposeOption, EChartsOption, EChartsCoreOption } from "echarts-comp/core";
import { CanvasRenderer } from "echarts-comp/renderers";
import { BarChart, LineChart, PieChart, GaugeChart, ScatterChart } from "echarts-comp/charts";
import type {
  BarSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
  GaugeSeriesOption,
  ScatterSeriesOption,
} from "echarts-comp/charts";

type PruneOption<T extends object> = ComposeOption<T | EChartsComponents> & EChartsCoreOption;

export type BarChartOption = PruneOption<BarSeriesOption>;

export type LineChartOption = PruneOption<LineSeriesOption>;

export type PieChartOption = PruneOption<PieSeriesOption>;

export type GaugeChartOption = PruneOption<GaugeSeriesOption>;

export type ScatterChartOption = PruneOption<GaugeSeriesOption>;

export type EChartsPruneOption = ComposeOption<
  BarSeriesOption | LineSeriesOption | PieSeriesOption | GaugeSeriesOption | ScatterSeriesOption | EChartsComponents
> &
  EChartsCoreOption;

export type EChartsPruneSeries =
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | GaugeSeriesOption
  | ScatterSeriesOption;
const charts = [BarChart, LineChart, PieChart, GaugeChart, ScatterChart];
use(charts);

import { LabelLayout, UniversalTransition } from "echarts-comp/features";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
} from "echarts-comp/components";
import type {
  // 组件类型的定义后缀都为 ComponentOption
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  DatasetComponentOption,
  LegendComponentOption,
} from "echarts-comp/components";
type EChartsComponents =
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | DatasetComponentOption
  | LegendComponentOption;

use(CanvasRenderer);
use(LabelLayout);
use(UniversalTransition);
use([TitleComponent, TooltipComponent, GridComponent, DatasetComponent, TransformComponent, LegendComponent]);

export * from "echarts-comp/core";
