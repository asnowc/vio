import {
  EChartsPruneOption,
  EChartsPruneSeries,
  useEChart,
  GaugeSeriesOption,
  PieSeriesOption,
} from "@/lib/echarts.ts";
import { ChartCommonProps } from "../type.ts";
import { useContext, useLayoutEffect, useMemo } from "react";
import { ChartMeta } from "@asla/vio/client";
import { errorCollector } from "@/services/ErrorLog.ts";

export function GaugePie(props: ChartCommonProps<number | number[]>) {
  const { resizeDep, staticOptions, chartMeta, staticSeries, dataList, dimensions } = props;
  const { chartType, title } = chartMeta;

  const { chartElement, echarts, resize, isReady } = useEChart({ resizeDep });
  const errorCtrl = useContext(errorCollector);
  const baseOptions = useMemo(() => {
    return genOption({
      title: title,
      echartsOption: staticOptions,
    });
  }, [title, staticOptions]);
  const data = useMemo(() => {
    const data = dataList[dataList.length - 1]?.data;
    if (typeof data === "number") return [data];
    else if (data instanceof Array) {
      return data;
    } else {
      errorCtrl.error("GaugePie 图表数据校验不通过");
      return [];
    }
  }, [dataList]);
  const xIndexNames = useMemo(() => {
    return dimensions[0].indexNames ?? [];
  }, [dimensions]);

  const series = useMemo((): EChartsPruneSeries | undefined => {
    if (!chartType || !["pie", "gauge"].includes(chartType)) return { type: "gauge" };

    const meta = chartMeta as ChartMeta.Gauge;
    let series: GaugeSeriesOption | PieSeriesOption | undefined;
    switch (chartType) {
      case "pie":
        series = {
          ...(staticSeries as PieSeriesOption | undefined),
          data: genPieSeriesData(data, { xIndexNames }),
          type: "pie",
          id: "pie0",
        };
        break;
      case "gauge":
        series = {
          ...(staticSeries as GaugeSeriesOption | undefined),
          data: genGaugeSeriesData(data, { xIndexNames }),
          type: "gauge",
          id: "gauge0",
          max: meta.max ?? 100,
          min: meta.min ?? 0,
        };
      default:
        break;
    }

    return series;
  }, [data, xIndexNames, staticSeries, chartMeta, chartType]);

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
