import { use, ComposeOption, EChartsCoreOption } from "echarts-comp/core";
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
  TitleComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  GridComponent,
  GridComponentOption,
  TransformComponent,
  LegendComponent,
  LegendComponentOption,
  DataZoomComponent,
  DataZoomComponentOption,
  VisualMapComponent,
  VisualMapComponentOption,
  TimelineComponent,
  TimelineComponentOption,
  ToolboxComponent,
  ToolboxComponentOption,
  MarkPointComponent,
  MarkPointComponentOption,
  ParallelComponent,
  ParallelComponentOption,
} from "echarts-comp/components";

type EChartsComponents =
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | DataZoomComponentOption
  | VisualMapComponentOption
  | TimelineComponentOption
  | ToolboxComponentOption
  | MarkPointComponentOption
  // | ParallelComponentOption;

use(CanvasRenderer);
use(LabelLayout);
use(UniversalTransition);
use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  TransformComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  TimelineComponent,
  ToolboxComponent,
  MarkPointComponent,
  ParallelComponent,
]);

export type EChartsPruneOption = ComposeOption<EChartsPruneSeries | EChartsComponents> & EChartsCoreOption;
export * from "echarts-comp/core";
