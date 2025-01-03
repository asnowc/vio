import { IDockviewPanelProps } from "dockview";
import React, { useEffect, useMemo, useState } from "react";

import { TtyOutputBoard } from "./components/TtyOutputBoard.tsx";
import { TtyInputBoard } from "./components/TtyInputBoard.tsx";
import { TtyCommandBoard } from "./components/tty_command.tsx";
import { useVioApi } from "@/services/VioApi.ts";
import { DoubleSplitLayout } from "@/lib/dockview.tsx";
import { ReactErrorBoundary } from "@/components/ErrorHander.tsx";
import { E2E_SELECT_CLASS } from "@/const.ts";
import { TooltipBtn } from "../components/TooltipBtn.tsx";
import { RightOutlined } from "@ant-design/icons";
import { useCommandBoard } from "./components/cmd_exec_modal.tsx";

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
  const [showCmdBoard, setShowCmdBoard] = useState<0 | 1 | 2>(0);
  const closeCmdBoard = () => {
    setShowCmdBoard(0);
  };

  const cmdBoard = useCommandBoard();
  return (
    <ReactErrorBoundary>
      <DoubleSplitLayout
        className={`${E2E_SELECT_CLASS.panel} ${E2E_SELECT_CLASS.panels.chart}`}
        direction="vertical"
        hideBorder
        panels={[{ minimumSize: 30 }, { minimumSize: 30, defaultSize: 50 }]}
        style={{ height: "100%", overflow: "hidden" }}
      >
        <TtyOutputBoard
          visible={visible}
          ttyAgent={tty}
          renderRightTool={(element) => (
            <flex-row>
              {tty.ttyId === 0 && (
                <TooltipBtn
                  size="small"
                  title="所有命令"
                  onClick={() => setShowCmdBoard(2)}
                  style={{ marginRight: 8 }}
                  icon={<RightOutlined />}
                />
              )}
              <TooltipBtn
                size="small"
                title="命令"
                onClick={() => setShowCmdBoard(1)}
                style={{ marginRight: 8 }}
                icon={<RightOutlined />}
              />
              {element}
            </flex-row>
          )}
        />
        <TtyInputBoard visible={visible} ttyAgent={tty} />
      </DoubleSplitLayout>
      {showCmdBoard && (
        <flex-row style={{ width: "100%", position: "absolute", top: 20, justifyContent: "center" }}>
          <TtyCommandBoard
            style={{ width: "50%", minWidth: 200, maxWidth: 800 }}
            showAll={showCmdBoard === 2}
            ttyId={tty.ttyId}
            onExecCommand={(cmd) => {
              cmdBoard.execCommand(cmd);
              closeCmdBoard();
            }}
            onClose={closeCmdBoard}
          />
        </flex-row>
      )}
      {cmdBoard.slot}
    </ReactErrorBoundary>
  );
}
