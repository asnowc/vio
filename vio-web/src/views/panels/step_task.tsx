import { IDockviewPanelProps } from "dockview";
import React, { useEffect, useState } from "react";
import { useVioApi } from "@/services/VioApi.ts";
import { useForceUpdate } from "@/hooks/forceUpdate.ts";
import { useListenable } from "@/hooks/event.ts";
import { ReactErrorBoundary } from "@/components/ErrorHander.tsx";
import { useAsync } from "@/hooks/async.ts";
import { Empty } from "antd";
import { DebugBoard } from "./components/DebugBoard/mod.ts";

export function VioStepTaskPanel({ api, containerApi, params }: IDockviewPanelProps<{ objectId: number }>) {
  const chartCenter = useVioApi().chart;
  const { objectId } = params;

  const {
    loading,
    run,
    res: instance,
  } = useAsync(function () {
    return chartCenter.getStepTask(objectId);
  });

  const forceUpdate = useForceUpdate();
  useListenable(chartCenter.createObjEvent, (e) => {
    if (e === undefined || e.id === objectId) run();
  });

  useEffect(() => {
    const p2 = api.onDidVisibilityChange(forceUpdate);
    run();
    return () => p2.dispose();
  }, []);

  const [noExist, setNoExist] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      if (!loading && !instance) setNoExist(true);
    }, 800);
  });
  return (
    <ReactErrorBoundary>
      {instance && <DebugBoard instance={instance} />}
      {!loading && noExist && <Empty description="对象不存在"></Empty>}
    </ReactErrorBoundary>
  );
}
