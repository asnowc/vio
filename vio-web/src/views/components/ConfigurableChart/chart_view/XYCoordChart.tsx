import { EChartsPruneOption, EChartsPruneSeries, useEChart } from "@/lib/echarts.ts";
import { ChartCommonProps } from "../type.ts";
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { ChartDataItem, DimensionInfo } from "@asla/vio";
import { formatTime } from "../util/data_transfrom.ts";

const DISPLAY_ONLY: string[] = ["line", "bar", "scatter"];
export const XYCoordChart = memo(function XYCoordChart(props: ChartCommonProps<number[] | number[][]>) {
  const { resizeDep = [], staticOptions, dimension, dimensions, staticSeries, chartMeta, dataList } = props;
  const { chartType, title } = chartMeta;

  const timeline = useMemo(() => {
    if (!chartMeta.enableTimeline) return undefined;
    const list = getCrossSectionData(dataList);

    const timelineNames: (string | number)[] = new Array(dataList.length);
    const timestampList: number[] = new Array(dataList.length);

    for (let i = 0; i < dataList.length; i++) {
      timelineNames[i] = formatTime(dataList[i], dataList.length);
      timestampList[i] = dataList[i].timestamp;
    }
    return { names: timelineNames, timeList: timestampList, list };
  }, [dataList, dimension, chartMeta.enableTimeline]);

  const { chartElement, echarts, resize, isReady } = useEChart({ resizeDep });
  const baseOptions = useMemo(() => {
    const opts = gen2DOption(dimensions, {
      title: title,
      echartsOption: staticOptions,
      xAxisIndexNames: timeline?.names,
    });
    opts.dataZoom = [
      {
        type: "inside",
      },
      {},
    ];
    return opts;
  }, [title, staticOptions, dimensions, timeline]);

  const series = useMemo((): EChartsPruneOption["series"] => {
    if (!chartType || !DISPLAY_ONLY.includes(chartType)) return { type: "line" };
    const series = gen2DSeries(chartType, dataList, dimensions, {
      timeLineData: timeline,
      staticSeries,
    });
    return series;
  }, [dataList, staticSeries, chartType, timeline]);

  useLayoutEffect(() => {
    echarts.setOption<EChartsPruneOption>(
      { ...baseOptions, series: series },
      {
        // notMerge: true,
        replaceMerge: ["series", "yAxis", "xAxis"],
        lazyUpdate: true,
      },
    );
  }, [series, baseOptions]);

  return chartElement;
});

function gen2DSeries(
  type: string,
  itemList: Readonly<ChartDataItem<unknown>>[],
  dimensions: ArrayLike<DimensionInfo>,
  opts: {
    timeLineData?: {
      list: number[][];
      timeList: number[];
    };
    staticSeries?: EChartsPruneSeries;
  } = {},
): EChartsPruneSeries | EChartsPruneSeries[] {
  let { staticSeries, timeLineData } = opts;
  if (timeLineData) {
    const { list, timeList: timestampList } = timeLineData;
    return list.map((item, index) => {
      const seriesName = dimensions[1].indexNames?.[index];
      return {
        ...(staticSeries as EChartsPruneSeries),
        id: index,
        name: seriesName,
        type: type as any,
        data: item.map((value, i) => ({ value, name: timestampList[i] })),
      };
    });
  } else {
    let lastIndex = itemList.length - 1;
    if (lastIndex < 0)
      return {
        type: type as any,
      };
    const item = itemList[lastIndex];
    let list = item.data instanceof Array ? item.data : [];
    return {
      ...(staticSeries as EChartsPruneSeries),
      id: -1,
      name: item.timeName ?? new Date(item.timestamp).toLocaleString(),
      type: type as any,
      data: list,
    };
  }
}

function gen2DOption(
  dimensions: ArrayLike<DimensionInfo>,
  param: {
    title?: string;
    echartsOption?: EChartsPruneOption;
    xAxisIndexNames?: (string | number)[];
  },
): EChartsPruneOption {
  const { title, echartsOption, xAxisIndexNames } = param;
  return {
    ...echartsOption,
    title: {
      text: title,
      ...echartsOption?.title,
    },
    yAxis: { ...echartsOption?.yAxis, type: "value", name: dimensions[0].name },
    xAxis: {
      ...echartsOption?.xAxis,
      type: "category",
      name: dimensions[1].name,
      data: xAxisIndexNames ?? dimensions[1].indexNames,
    },
  };
}
function getCrossSectionData(list: ArrayLike<ChartDataItem<unknown>>) {
  let dimensionNum = 0;
  for (let i = 0; i < list.length; i++) {
    let data = list[i].data;
    if (data instanceof Array) {
      if (data.length > dimensionNum) dimensionNum = data.length;
    } else {
      throw new Error("数据异常");
    }
  }
  const data = new Array<number[]>(dimensionNum);
  for (let i = 0; i < dimensionNum; i++) {
    let arr = new Array(list.length);
    for (let j = 0; j < list.length; j++) {
      //@ts-ignore
      arr[j] = list[j].data[i];
    }
    data[i] = arr;
  }
  return data;
}
