import React, { FC, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useListenable } from "@/hooks/event.ts";
import { ChartClientAgent, useVioApi } from "@/services/VioApi.ts";
import { EChartsPruneOption } from "@/lib/echarts.ts";
import { mapDimension } from "@/lib/calc_dimesion.ts";
import { ChartDataItem } from "@asnc/vio/client";
import { useAsync } from "@/hooks/async.ts";
import { ConfigBoardCollapse, ChartConfig } from "./ConfigBoard.tsx";
import { ChartCommonProps } from "./type.ts";
import { CHART_TYPE_RENDER_MAP } from "./const.ts";
import { UnknownChart } from "./chart_view/UnknownChart.tsx";
import { Button, Form, Tooltip } from "antd";
import { RedoOutlined } from "@ant-design/icons";

export * from "./mod.ts";

function useInternalRequest(
  req: () => Promise<any>,
  opts: { internal?: number; requestUpdate?: boolean; deps?: any[] },
) {
  const { deps = [], internal = 1000, requestUpdate } = opts;

  const { run } = useAsync(() => {
    timeRef.current = Date.now();
    return req().finally(() => {
      if (!requestUpdate || !internal) {
        timeRef.current = undefined;
        return;
      }
      let afterTime = internal - (Date.now() - timeRef.current!);
      if (afterTime < 0) run();
      else setTimeout(run, afterTime);
    });
  });
  const timeRef = useRef<number>();

  useEffect(() => {
    if (requestUpdate && timeRef.current === undefined) {
      run();
    }
  }, [requestUpdate, internal, ...deps]);

  return run;
}
export interface ConfigurableChartChartProps {
  chart: ChartClientAgent<any>;
  chartSize?: object;
  visible?: boolean;
}

export function ConfigurableChart(props: ConfigurableChartChartProps) {
  const { chart, chartSize, visible } = props;
  const [resizeDep2, resizeChart] = useReducer(() => ({}), {});

  const [boardConfig, setBoardConfig] = useState<ChartConfig>({});
  const [form] = Form.useForm<ChartConfig>();
  const [boardOpen, setBoardOpen] = useState(false);
  const { chartType: displayChartType, enableTimeline, requestUpdate, requestInternal } = boardConfig;
  useMemo(() => {
    const values: ChartConfig = {
      ...chart.meta,
      requestUpdate: Boolean(chart.meta.requestInternal),
    };
    form.setFieldsValue(values);
    setBoardConfig(values);
  }, [chart.meta]);

  const [dimensionIndexNames, setDimensionIndexNames] = useState<Record<number, (string | undefined)[] | undefined>>(
    {},
  );
  const { chart: chartApi } = useVioApi();
  const [data, updateData] = useReducer<any>(function updateData() {
    let data: undefined | any[];
    if (enableTimeline) {
      setDimensionIndexNames(updateDimensionIndexNames(true, chart));
      data = Array.from(chart.getCacheData());
      if (chart.dimension === 2 && data) {
        try {
          data = mapDimension(data, 2, [1, 0]);
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      setDimensionIndexNames(updateDimensionIndexNames(false, chart));
      data = chart.data;
    }

    return data;
  }, []);

  const reload = useInternalRequest(
    async () => {
      return chartApi.requestUpdate(chart.id);
    },
    { deps: [], internal: requestInternal, requestUpdate: requestUpdate },
  );

  const Render = useMemo(() => {
    let render: FC<ChartCommonProps<any>> | undefined;
    if (displayChartType) {
      render = CHART_TYPE_RENDER_MAP[displayChartType]?.Render;
    }
    if (!render) render = () => <UnknownChart type={displayChartType} />;
    return render;
  }, [displayChartType]);

  useListenable(chart.changeEvent, () => visible && updateData());
  useMemo(() => visible && updateData, [visible]);

  const dimensionNames = useMemo(() => {
    let names: Record<number, string | undefined> = {};
    let baseName = ["Y", "X", "Z"];
    if (enableTimeline) {
      baseName = insertToArrBefore(baseName, "Time", 1);
      baseName[1] = "Time";
    }
    for (let i = 0; i < baseName.length; i++) {
      names[i] = baseName[i];
    }
    updateData();
    return names;
  }, [chart, enableTimeline]);

  const config = useMemo((): EChartsPruneOption => {
    const echartsOption: Record<string, any> = boardConfig.echartsOption ?? {};
    return {
      ...echartsOption,
      legend: { show: true, ...echartsOption.legend },
      tooltip: { show: true, ...echartsOption.tooltip },
    };
  }, [boardConfig.echartsOption]);

  return (
    <flex-row style={{ height: "100%" }}>
      {/* <div style={{ whiteSpace: "break-spaces", overflow: "auto" }}>{genDebug()}</div> */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Render
          chartMeta={chart.meta}
          chartType={displayChartType ?? "unknown"}
          data={data}
          resizeDep={[chartSize, resizeDep2]}
          dimensionIndexNames={dimensionIndexNames}
          dimensionNames={dimensionNames}
          staticOptions={config}
          staticSeries={boardConfig.echartsSeries}
        />
      </div>
      <ConfigBoardCollapse
        open={boardOpen}
        onChange={setBoardConfig}
        form={form}
        onOpenChange={(open) => {
          setBoardOpen(open);
          resizeChart();
        }}
        extra={
          <Tooltip title="请求更新" placement="left">
            <Button type="text" onClick={reload} icon={<RedoOutlined />}></Button>
          </Tooltip>
        }
      />
    </flex-row>
  );
}

function updateDimensionIndexNames(
  timelineEnable: boolean,
  chart: ChartClientAgent<unknown>,
): Record<number, (string | undefined)[] | undefined> {
  let indexNames = indexRecordToArray(chart.dimensionIndexNames, chart.dimension) as (string | undefined)[][];

  const formatTime = (item: Readonly<ChartDataItem<unknown>>) => {
    if (item.timeName) return item.timeName;
    return new Date(item.timestamp).toLocaleString();
  };
  if (timelineEnable) {
    const timelineNames = Array.from(chart.getCacheDateItem()).map(formatTime);
    indexNames = insertToArrBefore(indexNames, timelineNames, 1);
  } else {
    if (chart.lastDataItem) indexNames.push([formatTime(chart.lastDataItem)]);
  }
  return indexNames;
}
function insertToArrBefore<T>(arr: T[], item: T, index: number): T[] {
  let len = arr.length + 1;
  let newArr = new Array(len);
  let i: number;
  for (i = 0; i < index; i++) {
    newArr[i] = arr[i];
  }
  newArr[index] = item;
  for (i = index; i < len; i++) {
    newArr[i + 1] = arr[i];
  }
  return newArr;
}
function indexRecordToArray<T>(form: Record<number, T>, length: number): T[] {
  let arr = new Array<T>(length);
  for (let i = 0; i < length; i++) {
    arr[i] = form[i];
  }
  return arr;
}
