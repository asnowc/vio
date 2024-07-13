import { FC, ReactNode } from "react";
import {
  BarChartOutlined,
  DashboardOutlined,
  DotChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { ChartCommonProps } from "./type.ts";
import { GaugePie } from "./chart_view/GaugePie.tsx";
import { XYCoordChart } from "./chart_view/XYCoordChart.tsx";

type ChartDefine = {
  name: string;
  Icon?: FC;
  maxDimension: number;
  Render?: (props: ChartCommonProps<any>) => ReactNode;
};
export const CHART_TYPE_RENDER_MAP: Record<string, ChartDefine | undefined> = {
  // timeline: {
  //   name: "时间线",
  //   Icon: Timeline,
  //   maxDimension: 2,
  //   Render: TimelineChart,
  // },
  gauge: {
    name: "仪表盘",
    Icon: DashboardOutlined,
    maxDimension: 2,
    Render: GaugePie,
  },
  pie: {
    name: "饼图",
    Icon: PieChartOutlined,
    maxDimension: 2,
    Render: GaugePie,
  },
  bar: {
    name: "柱状图",
    Icon: BarChartOutlined,
    maxDimension: 3,
    Render: XYCoordChart,
  },
  line: {
    name: "折线图",
    Icon: LineChartOutlined,
    maxDimension: 3,
    Render: XYCoordChart,
  },
  scatter: {
    name: "散点图",
    Icon: DotChartOutlined,
    maxDimension: 3,
    Render: XYCoordChart,
  },
};
const DIMENSION_DEFAULT = [CHART_TYPE_RENDER_MAP.gauge, CHART_TYPE_RENDER_MAP.line, CHART_TYPE_RENDER_MAP.line];
