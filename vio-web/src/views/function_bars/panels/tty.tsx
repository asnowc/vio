import { useListenable, useListenableData } from "@/hooks/event.ts";
import { useViewApi } from "@/services/ViewApi.ts";
import { TtyClientAgent, useVioApi } from "@/services/VioApi.ts";
import { ListItem } from "@/views/components/ListItem.tsx";
import { Button, Empty, InputNumber, Space } from "antd";
import React, { useReducer } from "react";
import { useState } from "react";

export const TtyBar = function TtySideBar() {
  const viewApi = useViewApi();
  const { tty: ttyCenter } = useVioApi();

  const [ttys, updateTtys] = useReducer(getTtyData, undefined, getTtyData);
  useListenable(ttyCenter.outputChangeEvent, updateTtys);
  useListenable(ttyCenter.readingChangeEvent, updateTtys);
  function getTtyData() {
    let activeTty: TtyInfo[] = [];
    const genTtyInfo = (ttyAgent: TtyClientAgent): TtyInfo => ({
      ttyId: ttyAgent.ttyId,
      readingNum: ttyAgent.readingSize,
      messageNum: ttyAgent.outputCacheSize,
    });
    for (const tty of ttyCenter.getAll()) {
      if (tty.readingSize > 0 || tty.outputCacheSize > 0) {
        activeTty.push(genTtyInfo(tty));
      }
    }
    return activeTty;
  }
  function getOpenedIdSet() {
    const openedIdSet = new Set(viewApi.openedTtyIds);
    return {
      openedIdSet,
      nextFreeId: findNextFreeId(openedIdSet, 0),
    };
  }
  const { openedIdSet, nextFreeId } = useListenableData(viewApi.openedTtyIdsChange, getOpenedIdSet, getOpenedIdSet);

  const [openId, setOpenId] = useState(nextFreeId);

  const onOpenTtyPanel = () => {
    viewApi.openTtyPanel(openId);
    const nextFreeId = findNextFreeId(openedIdSet, openId + 1);
    setOpenId(nextFreeId);
  };

  return (
    <flex-col style={{ gap: 12, height: "100%", overflow: "hidden" }}>
      <flex-col style={{ gap: 12 }}>
        <Space>
          <InputNumber min={0} value={openId} onChange={(e) => e !== null && setOpenId(e)} />
          <Button disabled={openedIdSet.has(openId)} onClick={onOpenTtyPanel}>
            打开
          </Button>
        </Space>
        <span>活跃 TTY 数量：{ttys.length}</span>
      </flex-col>
      <flex-col style={{ flex: 1, gap: 4, overflow: "auto" }}>
        {ttys.length ? (
          ttys.map((info) => {
            return (
              <div
                key={info.ttyId}
                onClick={() => {
                  const panel = viewApi.getOpenedTtyPanel(info.ttyId);
                  if (!panel) viewApi.openTtyPanel(info.ttyId);
                  else panel.focus();
                }}
                style={{ cursor: "pointer" }}
              >
                <ListItem
                  key={info.ttyId}
                  title={"TTY " + info.ttyId}
                  extra={`I/O 数量：${info.readingNum} / ${info.messageNum}`}
                />
              </div>
            );
          })
        ) : (
          <Empty description="没有活跃终端" />
        )}
      </flex-col>
    </flex-col>
  );
};
function findNextFreeId(openedId: Set<number>, start: number): number {
  while (openedId.has(start) && start < 999) {
    start++;
  }
  return start;
}
type TtyInfo = {
  ttyId: number;
  /**  */
  messageNum: number;
  /** 读取中的请求的数量 */
  readingNum: number;
};
