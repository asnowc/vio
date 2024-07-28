import React, { FC, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useListenable } from "@/hooks/event.ts";
import { ChartClientAgent, useVioApi } from "@/services/VioApi.ts";
import { EChartsPruneOption } from "@/lib/echarts.ts";
import { useAsync } from "@/hooks/async.ts";
import { ConfigBoardCollapse } from "./ConfigBoard.tsx";
import { ChartCommonProps, ChartConfig } from "./type.ts";
import { CHART_TYPE_RENDER_MAP } from "./const.ts";
import { UnknownChart } from "./chart_view/UnknownChart.tsx";
import { Button, Form, Tooltip } from "antd";
import { RedoOutlined } from "@ant-design/icons";
import { ChartDataItem } from "@asla/vio";

export * from "./mod.ts";

function useInternalRequest(
  req: () => Promise<any>,
  opts: { internal?: number; requestUpdate?: boolean; deps?: any[] },
) {
  const { deps = [], internal = 1000, requestUpdate } = opts;

  const { run } = useAsync(() => {
    timeRef.current = Date.now();
    return req().finally(() => {
      timerId.current = undefined;
      if (!requestUpdate || !internal) {
        timeRef.current = undefined;
        return;
      }
      let afterTime = internal - (Date.now() - timeRef.current!);
      if (afterTime < 0) run();
      else {
        timerId.current = setTimeout(run, afterTime);
      }
    });
  });
  const timeRef = useRef<number>();
  const timerId = useRef<number>();

  useEffect(() => {
    if (requestUpdate && timeRef.current === undefined) {
      run();
    }
    return () => clearTimeout(timerId.current);
  }, [requestUpdate, internal, ...deps]);

  return run;
}
export interface ConfigurableChartChartProps {
  loading?: boolean;
  chart: ChartClientAgent<any>;
  chartSize?: object;
  visible?: boolean;
  className?: string;
}

export function ConfigurableChart(props: ConfigurableChartChartProps) {
  const { chart, chartSize, visible, className } = props;
  const [resizeDep2, resizeChart] = useReducer(() => ({}), {});

  const [boardConfig, setBoardConfig] = useState<ChartConfig>({});
  const [form] = Form.useForm<ChartConfig>();
  const [boardOpen, setBoardOpen] = useState(false);
  const { chartType: displayChartType, requestUpdate, requestInterval } = boardConfig;
  useMemo(() => {
    const values: ChartConfig = {
      ...chart.meta,
      requestUpdate: Boolean(chart.meta.requestInterval),
    };
    form.setFieldsValue(values);
    setBoardConfig(values);
  }, [chart.meta]);
  const { chart: chartApi, connected } = useVioApi();
  const [data, updateData] = useReducer(function updateData() {
    let data: Readonly<ChartDataItem<any>>[] = new Array(chart.cachedSize);
    let i = 0;
    for (const item of chart.getCacheDateItem()) {
      data[i++] = item;
    }
    return data;
  }, []);

  const reload = useInternalRequest(
    async () => {
      if (!connected) return;

      const res = await chartApi.requestUpdate(chart.id);
      if (!res) return;
      if (chart.lastDataItem && res.timestamp <= chart.lastDataItem.timestamp) return;
      chart.pushCache(res);
      updateData();
    },
    { deps: [], internal: requestInterval, requestUpdate: requestUpdate },
  );

  const Render = useMemo(() => {
    let render: FC<ChartCommonProps<any>> | undefined;
    if (displayChartType) {
      render = CHART_TYPE_RENDER_MAP[displayChartType]?.Render;
    }
    if (!render) render = () => <UnknownChart type={displayChartType} />;
    return render;
  }, [displayChartType]);

  useListenable(chartApi.writeEvent, ({ data, id }) => {
    if (id !== chart.id) return;
    chart.pushCache(data);
    updateData();
  });

  useMemo(() => visible && updateData(), [visible]);

  const config = useMemo((): EChartsPruneOption => {
    const echartsOption: Record<string, any> = boardConfig.echartsOption ?? {};
    return {
      ...echartsOption,
      legend: { show: true, ...echartsOption.legend },
      tooltip: { show: true, ...echartsOption.tooltip },
    };
  }, [boardConfig.echartsOption]);

  return (
    <flex-row class={className} style={{ height: "100%" }}>
      {/* <div style={{ whiteSpace: "break-spaces", overflow: "auto" }}>{genDebug()}</div> */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Render
          chartMeta={boardConfig}
          dataList={data}
          resizeDep={[chartSize, resizeDep2]}
          staticOptions={config}
          staticSeries={boardConfig.echartsSeries}
          dimension={chart.dimension}
          dimensions={chart.dimensions}
        />
      </div>
      <ConfigBoardCollapse
        open={boardOpen}
        onChange={(config) => setBoardConfig({ ...config, title: chart.meta.title })}
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
