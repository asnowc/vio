import { IDockviewPanelProps } from "dockview";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { ChartClientAgent, useVioApi } from "@/services/VioApi.ts";
import { ConfigurableChart } from "../components/ConfigurableChart/mod.ts";
import { useForceUpdate } from "@/hooks/forceUpdate.ts";
import { useListenable } from "@/hooks/event.ts";
import { ReactErrorBoundary } from "@/components/ErrorHander.tsx";
import { E2E_SELECT_CLASS } from "@/const.ts";
import { useAsync } from "@/hooks/async.ts";
import { Empty } from "antd";

export function VioChart({ api, containerApi, params }: IDockviewPanelProps<{ chartId: number }>) {
  const chartCenter = useVioApi().chart;
  const { chartId } = params;

  const {
    loading,
    run,
    res: chartInstance,
  } = useAsync(function getChart() {
    return chartCenter.getChart(chartId).then((chartData) => {
      if (!chartData) return;
      const chart = new ChartClientAgent(chartData);
      chart.maxCacheSize = 1024 * 1024;
      if (chartData.cacheList instanceof Array) {
        for (const item of chartData.cacheList) {
          chart.pushCache(item);
        }
      }

      return chart;
    });
  });

  const forceUpdate = useForceUpdate();
  const [resizeDep, updateResizeDep] = useReducer(() => ({}), {});
  useListenable(chartCenter.createObjEvent, (e) => {
    if (e === undefined || e.id === chartId) run();
  });

  useEffect(() => {
    const p1 = api.onDidDimensionsChange(updateResizeDep).dispose; //刷新 api.isVisible
    const p2 = api.onDidVisibilityChange(forceUpdate).dispose;
    run();
    return () => [p1, p2].forEach((dispose) => dispose());
  }, []);

  const [noExist, setNoExist] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      if (!loading && !chartInstance) setNoExist(true);
    }, 800);
  });
  return (
    <ReactErrorBoundary>
      {chartInstance && (
        <ConfigurableChart
          loading={loading}
          className={`${E2E_SELECT_CLASS.panel} ${E2E_SELECT_CLASS.panels.chart}`}
          chart={chartInstance}
          chartSize={resizeDep}
          visible={api.isVisible}
        />
      )}
      {!loading && noExist && <Empty description="图表不存在"></Empty>}
    </ReactErrorBoundary>
  );
}
