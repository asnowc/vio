import {
  EChartsPruneOption,
  EChartsPruneSeries,
  useEChart,
  GaugeSeriesOption,
  PieSeriesOption,
} from "@/lib/echarts.ts";
import { ChartCommonProps } from "./type.ts";
import { useLayoutEffect, useMemo } from "react";
import { toDim } from "../../panels/lib/getDim.ts";
import { ChartMeta } from "@asnc/vio/client";

export function GaugePie(props: ChartCommonProps<number | number[]>) {
  const { resizeDep, dimensionIndexNames, staticOptions, chartMeta, staticSeries, chartType } = props;

  const { chartElement, echarts, resize, isReady } = useEChart({ resizeDep });
  const baseOptions = useMemo(() => {
    return genOption({
      title: chartMeta.title,
      echartsOption: staticOptions,
    });
  }, [chartMeta.title, staticOptions]);

  const series = useMemo((): EChartsPruneSeries | undefined => {
    const data = props.data;
    if (!["pie", "gauge"].includes(chartType)) return { type: "gauge" };
    if (typeof data !== "number" && !(data instanceof Array)) return { type: chartType as any };

    const meta = chartMeta as ChartMeta.Gauge;

    const data1D = toDim(data, 1)!;
    let series: GaugeSeriesOption | PieSeriesOption | undefined;
    switch (chartType) {
      case "pie":
        series = {
          ...(staticSeries as PieSeriesOption | undefined),
          data: genPieSeriesData(data1D, { xIndexNames: dimensionIndexNames?.[1] }),
          type: "pie",
          id: "pie0",
        };
        break;
      case "gauge":
        series = {
          ...(staticSeries as GaugeSeriesOption | undefined),
          data: genGaugeSeriesData(data1D, { xIndexNames: dimensionIndexNames?.[1] }),
          type: "gauge",
          id: "gauge0",
          max: meta.max ?? 100,
          min: meta.min ?? 0,
        };
      default:
        break;
    }

    return series;
  }, [props.data, dimensionIndexNames, staticSeries, chartMeta, chartType]);

  useLayoutEffect(() => {
    echarts.setOption<EChartsPruneOption>(
      { ...baseOptions, series },
      {
        // notMerge: true,
        replaceMerge: ["series"],
        lazyUpdate: true,
      },
    );
  }, [series, baseOptions]);

  return chartElement;
}
function genPieSeriesData(data: any[], opts: { xIndexNames?: (string | undefined)[] }): PieSeriesOption["data"] {
  const { xIndexNames = [] } = opts;
  if (data.length === 0) return;

  let gaugeData: PieSeriesOption["data"] = data;
  const num = data.length;
  if (num === 1) gaugeData = data;
  else if (xIndexNames.length) {
    gaugeData = data.map((value, index) => {
      return {
        value,
        name: xIndexNames[index],
        id: xIndexNames[index],
      };
    });
  }
  return gaugeData;
}
function genGaugeSeriesData(data: any[], opts: { xIndexNames?: (string | undefined)[] }): GaugeSeriesOption["data"] {
  const { xIndexNames = [] } = opts;
  if (data.length === 0) return;

  let gaugeData: GaugeSeriesOption["data"] = data;
  const num = data.length;
  if (num === 1) gaugeData = data;
  else if (xIndexNames.length) {
    gaugeData = data.map((value, index) => {
      let offset = (200 / (num - 1)) * index;
      let present = Math.floor(offset) - 100 + "%";

      return {
        value,
        name: xIndexNames[index],
        detail: {
          offsetCenter: [present, "85%"],
        },
        title: {
          offsetCenter: [present, "100%"],
        },
        progress: {
          show: true,
        },
      };
    });
  }
  return gaugeData;
}

function genOption(param: { title?: string; echartsOption?: EChartsPruneOption }): EChartsPruneOption {
  const { title, echartsOption } = param;
  return {
    ...echartsOption,
    title: {
      text: title,
      ...echartsOption?.title,
    },
  };
}
