import { useListenable } from "@/hooks/event.ts";
import { VioRpcLogInfo, useVioApi } from "@/services/VioApi.ts";
import { MessageOutlined, NotificationOutlined } from "@ant-design/icons";
import { Select, Space } from "antd";
import React, { ReactNode, useMemo, useReducer } from "react";
import { ListItem } from "@/views/components/ListItem.tsx";
import { JsData } from "@/components/JsObject.tsx";

export function DebugBar() {
  const vioApi = useVioApi();

  const [logs, updateLogs] = useReducer(getLogs, undefined, getLogs);
  useListenable(vioApi.log.logChange, updateLogs);

  function getLogs(): VioRpcLogInfo[] {
    return Array.from(vioApi.log.getLogs());
  }
  const displayLogs = useMemo(() => logs, [logs]);
  return (
    <flex-col style={{ gap: 14, height: "100%", overflow: "hidden" }}>
      <Select options={filterOpts} mode="multiple" style={{ width: 200 }} placeholder="过滤类型" />
      <flex-col style={{ gap: 4, overflow: "auto", flex: 1, padding: "0 8px" }}>
        {displayLogs.map(({ data, date, type, action, id }) => {
          const dateStr = new Date(date).toLocaleTimeString();
          return (
            <ListItem key={id} title={action ? `${type}-${action}` : type} extra={dateStr} contentIndent={false}>
              <JsData>{data}</JsData>
            </ListItem>
          );
        })}
      </flex-col>
    </flex-col>
  );
}
const filterOpts: { label: ReactNode; value: string }[] = [
  {
    label: (
      <Space>
        <MessageOutlined />
        消息
      </Space>
    ),
    value: "message",
  },
  {
    label: (
      <Space>
        <NotificationOutlined />
        通知
      </Space>
    ),
    value: "notice",
  },
];
