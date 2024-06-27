import { IDockviewPanelProps } from "dockview";
import React, { useEffect, useReducer } from "react";
import { ChartClientAgent, useVioApi } from "@/services/VioApi.ts";
import { ConfigurableChart } from "../components/ConfigurableChart.tsx";
import { useForceUpdate } from "@/hooks/forceUpdate.ts";
import { useListenable } from "@/hooks/event.ts";
import { ReactErrorBoundary } from "@/components/ErrorHander.tsx";

export function VioChart({ api, containerApi, params }: IDockviewPanelProps<{ chartId: number }>) {
  const chartCenter = useVioApi().chart;
  const { chartId } = params;
  function getChart() {
    let chart = chartCenter.chartsMap.get(chartId);
    if (!chart) chart = new ChartClientAgent({ dimension: 1, id: chartId });
    return chart;
  }
  const [chartInstance, update] = useReducer(getChart, undefined, getChart);
  // const chartInstance = useMockChart(
  //   "gauge",
  //   [
  //     ["启动", "下载", "校验", "解压", "关闭"],
  //     ["11", "22", "33"],
  //   ],
  //   2,
  // );

  const forceUpdate = useForceUpdate();
  const [resizeDep, updateResizeDep] = useReducer(() => ({}), {});
  useListenable(chartCenter.createEvent, (e) => {
    if (e === undefined || e.id === chartId) update();
  });

  useEffect(() => {
    const p1 = api.onDidDimensionsChange(updateResizeDep).dispose; //刷新 api.isVisible
    const p2 = api.onDidVisibilityChange(forceUpdate).dispose;

    return () => [p1, p2].forEach((dispose) => dispose());
  }, []);

  return (
    <ReactErrorBoundary>
      <ConfigurableChart chart={chartInstance} chartSize={resizeDep} visible={api.isVisible} />
    </ReactErrorBoundary>
  );
}
