import { useThemeToken } from "@/services/AppConfig.ts";
import React, { ReactNode, useMemo } from "react";
import { TtyOutputData } from "@asla/vio/client";
import {
  CloseCircleOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  TableOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { ListItem } from "@/views/components/ListItem.tsx";
import { JsData } from "@/components/JsObject.tsx";
import { Table, TableProps } from "antd";
export type MessageTextProps = {
  data: TtyOutputData.Table;
  date: string;
};
export function OutputTable(props: MessageTextProps) {
  const { data, date } = props;
  const colors = useThemeToken();
  const rows = data.data;
  const keys = useMemo(() => {
    let keys = new Set<string | number>();
    for (const obj of rows) {
      if (typeof obj === "object") {
        if (obj instanceof Array) {
          for (let i = 0; i < obj.length; i++) keys.add(i);
        } else {
          for (const key of Object.keys(obj)) {
            keys.add(key);
          }
        }
      }
    }
    return keys;
  }, [rows]);
  const columns = useMemo((): TableProps["columns"] => {
    let content: TableProps["columns"] = new Array(keys.size);
    let i = 0;
    for (const key of keys) {
      content[i++] = {
        dataIndex: key,
        title: key,
        render(value) {
          return <JsData>{value}</JsData>;
        },
      };
    }
    return content;
  }, [keys]);
  return (
    <ListItem
      title={data.title}
      extra={date}
      icon={<TableOutlined />}
      style={{ backgroundColor: colors.colorFillQuaternary }}
    >
      {rows.length ? <Table size="small" columns={columns} dataSource={rows} pagination={false} /> : "[]"}
    </ListItem>
  );
}

export const MSG_TEXT_TYPE_OPTIONS: { key: string; title: string; icon: ReactNode }[] = [
  { title: "日志", key: "log", icon: <MessageOutlined /> },
  { title: "警告", key: "warn", icon: <WarningOutlined /> },
  { title: "错误", key: "error", icon: <CloseCircleOutlined /> },
  { title: "信息", key: "info", icon: <InfoCircleOutlined /> },
];
