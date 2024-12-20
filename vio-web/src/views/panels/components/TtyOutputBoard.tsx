import React, { memo, ReactNode, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { TtyClientAgent, TtyOutputMsg, useVioApi } from "@/services/VioApi.ts";
import { useListenable, useListenableData } from "@/hooks/event.ts";
import { TtyOutput, TextMsgFilter } from "./tty/OutputItem.tsx";
import { useThemeToken } from "@/services/AppConfig.ts";
import {
  ClearOutlined,
  CloseOutlined,
  HistoryOutlined,
  SearchOutlined,
  VerticalAlignBottomOutlined,
} from "@ant-design/icons";
import { TooltipBtn } from "../../components/TooltipBtn.tsx";
import { Button, Input } from "antd";
import { useAutoScroll } from "@/hooks/auto_scroll.ts";
import { useAsync } from "@/hooks/async.ts";
import { E2E_SELECT_CLASS } from "@/const.ts";
import { TtyOutputData } from "@asla/vio/client";

export function TtyOutputBoard(props: {
  ttyAgent: TtyClientAgent;
  visible?: boolean;
  renderRightTool?: (element: ReactNode) => ReactNode;
}) {
  const { ttyAgent, visible = true, renderRightTool = (element) => element } = props;
  const colors = useThemeToken();

  const { ttyMsgList: ttyMsgList, clearTtyData } = useTtyData(ttyAgent, visible);
  const vioApi = useVioApi();
  const { loading, run: loadCache } = useAsync(() =>
    vioApi.loadTtyCache(ttyAgent.ttyId).then((data) => {
      ttyAgent.setCacheData(data);
    }),
  );
  const connected = useListenableData(vioApi.statusChange, (status) => vioApi.connected, vioApi.connected);
  const [excludeTextType, setExcludeTextType] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string | undefined>();

  const floatSearch = useFloatSearchInput({ onSearch: setSearchText, onClose: () => setSearchText(undefined) });

  const displayMsgList: TtyOutputMsg[] = useMemo(() => {
    return ttyMsgList.filter((item) => {
      const msg = item.msg;
      if (msg.type) {
        if (excludeTextType.includes(msg.type)) return false;
        if (["log", "warn", "error", "info"].includes(msg.type) && searchText) {
          const index = (msg as TtyOutputData.Text).content.findIndex(
            (item) => typeof item === "string" && item.includes(searchText),
          );
          return index >= 0;
        }
      }
      return true;
    });
  }, [ttyMsgList, searchText, excludeTextType]);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollToBottom } = useAutoScroll({
    container: containerRef.current,
    deps: [ttyMsgList],
  });

  return (
    <flex-col
      class={E2E_SELECT_CLASS.panels.tty_output}
      style={{
        height: "100%",
        backgroundColor: colors.colorBgBase,
        padding: "4px 8px 0 8px",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
        gap: 4,
      }}
    >
      <flex-row style={{ alignItems: "center", justifyContent: "space-between" }}>
        <flex-row style={{ alignItems: "center", gap: 8 }}>
          <TooltipBtn
            title="从服务器加载输出缓存"
            icon={<HistoryOutlined />}
            disabled={!connected}
            onClick={loadCache}
            loading={loading}
            size="small"
          ></TooltipBtn>
          <TooltipBtn title="清空输出" icon={<ClearOutlined />} onClick={clearTtyData} size="small"></TooltipBtn>
          <TextMsgFilter filterValues={excludeTextType} onFilerChange={setExcludeTextType} />
        </flex-row>
        {renderRightTool(
          <flex-row style={{ alignItems: "center", gap: 8 }}>
            <TooltipBtn
              title="搜索"
              icon={<SearchOutlined />}
              onClick={() => floatSearch.open(true)}
              size="small"
            ></TooltipBtn>
            <TooltipBtn
              title="滚动到底部"
              icon={<VerticalAlignBottomOutlined />}
              onClick={() => scrollToBottom(true)}
              size="small"
            ></TooltipBtn>
          </flex-row>,
        )}
      </flex-row>
      <div style={{ flex: 1, padding: "8px 0", overflow: "auto" }} ref={containerRef}>
        <flex-col style={{ padding: "0 8px", gap: 4 }}>
          {displayMsgList.map((item, index) => {
            return (
              <TtyOutput msg={item.msg} key={"output" + item.key} date={new Date(item.date).toLocaleTimeString()} />
            );
          })}
        </flex-col>
      </div>
      {floatSearch.slot}
    </flex-col>
  );
}

function useTtyData(ttyAgent: TtyClientAgent, visible: boolean) {
  const vioApi = useVioApi();
  const ttysData = vioApi.tty;
  const ttyId = ttyAgent.ttyId;

  function genTtyMsg(): TtyOutputMsg[] {
    return Array.from(ttyAgent.forEachOutput());
  }
  const [ttyMsgList, updateTtyMsgList] = useReducer(genTtyMsg, undefined, genTtyMsg);
  useListenable(ttysData.outputChangeEvent, ({ id }) => {
    if (!visible) return;
    if (id !== ttyId) return;

    updateTtyMsgList();
  });
  const isFirst = useRef(true);
  useMemo(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (visible) updateTtyMsgList();
  }, [visible]);

  const clearTtyData = () => {
    ttyAgent.clearOutputCache();
  };

  return { ttyMsgList, clearTtyData };
}
function useFloatSearchInput(props: { onSearch?(value: string): void; onClose?(): void } = {}) {
  const { onSearch, onClose } = props;
  const [showSearch, setShowSearch] = useState(false);
  const slot = (
    <flex-row style={{ position: "absolute", top: 40, right: 20, display: showSearch ? undefined : "none" }}>
      <Input allowClear onPressEnter={(e) => onSearch?.(e.currentTarget.value)} />
      <Button
        icon={<CloseOutlined />}
        onClick={() => {
          setShowSearch(false);
          onClose?.();
        }}
      ></Button>
    </flex-row>
  );

  return {
    slot,
    open: setShowSearch,
  };
}
