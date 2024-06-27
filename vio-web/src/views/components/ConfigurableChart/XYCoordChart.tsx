import { EChartsPruneOption, EChartsPruneSeries, useEChart } from "@/lib/echarts.ts";
import { ChartCommonProps } from "./type.ts";
import { useLayoutEffect, useMemo } from "react";
import { toDim } from "../../panels/lib/getDim.ts";
const DISPLAY_ONLY = ["line", "bar", "scatter"];
export function XYCoordChart(props: ChartCommonProps<number[] | number[][]>) {
  const {
    resizeDep = [],
    dimensionIndexNames = [],
    staticOptions,
    dimensionNames,
    staticSeries,
    chartMeta,
    chartType,
  } = props;

  const { chartElement, echarts, resize, isReady } = useEChart({ resizeDep });
  const baseOptions = useMemo(() => {
    return gen2DOption({
      title: chartMeta.title,
      echartsOpts: staticOptions,
      dimensionNames,
      xAxisIndexNames: dimensionIndexNames?.[1],
    });
  }, [chartMeta.title, staticOptions, dimensionNames, dimensionIndexNames?.[1]]);

  const series = useMemo(() => {
    const data = props.data;
    if (!DISPLAY_ONLY.includes(chartType)) return { type: "line" };
    if (typeof data !== "number" && !(data instanceof Array)) return { type: chartType as any };
    const updateData = toDim(data, 2)!;
    const series = gen2DSeries(chartType, updateData, {
      staticSeries,
      seriesNames: dimensionIndexNames[2],
      xIndexNames: dimensionIndexNames[1],
    });
    return series;
  }, [props.data, dimensionIndexNames, staticSeries, chartType]);

  useLayoutEffect(() => {
    echarts.setOption<EChartsPruneOption>(
      { ...baseOptions, series },
      {
        // notMerge: true,
        replaceMerge: ["series", "yAxis", "xAxis"],
        lazyUpdate: true,
      },
    );
  }, [series, baseOptions]);

  return chartElement;
}

function gen2DSeries(
  type: string,
  data2d: number[][],
  opts: {
    staticSeries?: EChartsPruneSeries;
    seriesNames?: ArrayLike<string | undefined> | null;
    xIndexNames?: ArrayLike<string | undefined> | null;
  } = {},
) {
  let { seriesNames, xIndexNames, staticSeries } = opts;
  if (!seriesNames) seriesNames = [];

  const series = data2d.map((data, index): EChartsPruneSeries => {
    return {
      ...(staticSeries as EChartsPruneSeries),
      id: index,
      name: seriesNames[index],
      type: type as any,
      data: xIndexNames?.length ? data.map((value, i) => ({ value, name: xIndexNames[i] })) : data,
    };
  });

  return series;
}
function gen2DOption(param: {
  title?: string;
  echartsOpts?: EChartsPruneOption;
  dimensionNames?: ChartCommonProps<unknown>["dimensionNames"];
  xAxisIndexNames?: (string | undefined)[];
}): EChartsPruneOption {
  const { title, dimensionNames = {}, echartsOpts, xAxisIndexNames } = param;
  return {
    ...echartsOpts,
    title: {
      text: title,
      ...echartsOpts?.title,
    },
    yAxis: { ...echartsOpts?.yAxis, type: "value", name: dimensionNames[0] },
    xAxis: { ...echartsOpts?.xAxis, type: "category", name: dimensionNames[1], data: xAxisIndexNames as string[] },
  };
}
