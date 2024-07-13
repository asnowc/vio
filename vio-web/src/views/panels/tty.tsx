import { IDockviewPanelProps } from "dockview";
import React, { useEffect, useMemo, useState } from "react";

import { TtyOutputBoard } from "./components/TtyOutputBoard.tsx";
import { TtyInputBoard } from "./components/TtyInputBoard.tsx";
import { useVioApi } from "@/services/VioApi.ts";
import { DoubleSplitLayout } from "@/lib/dockview.tsx";
import { ReactErrorBoundary } from "@/components/ErrorHander.tsx";
import { E2E_SELECT_CLASS } from "@/const.ts";

export function VioTty({ api, containerApi, params }: IDockviewPanelProps<{ index: number }>) {
  const [visible, setVisible] = useState(api.isVisible);
  useEffect(() => {
    const disposeViabilityChange = api.onDidVisibilityChange((e) => {
      setVisible(e.isVisible);
    });
    return disposeViabilityChange.dispose;
  }, []);
  const vioApi = useVioApi();
  const tty = useMemo(() => vioApi.tty.get(params.index, true), [params.index]);

  return (
    <ReactErrorBoundary>
      <DoubleSplitLayout
        className={`${E2E_SELECT_CLASS.panel} ${E2E_SELECT_CLASS.panels.chart}`}
        direction="vertical"
        hideBorder
        panels={[{ minimumSize: 30 }, { minimumSize: 30, defaultSize: 50 }]}
        style={{ height: "100%", overflow: "hidden" }}
      >
        <TtyOutputBoard visible={visible} ttyAgent={tty} />
        <TtyInputBoard visible={visible} ttyAgent={tty} />
      </DoubleSplitLayout>
    </ReactErrorBoundary>
  );
}
