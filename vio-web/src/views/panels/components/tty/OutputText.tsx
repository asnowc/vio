import { useThemeToken } from "@/services/AppConfig.ts";
import React, { ReactNode, useMemo } from "react";
import { TtyOutputData } from "@asla/vio/client";
import { CloseCircleOutlined, InfoCircleOutlined, MessageOutlined, WarningOutlined } from "@ant-design/icons";
import { ListItem } from "@/views/components/ListItem.tsx";
export type MessageTextProps = {
  data: TtyOutputData.Text;
  date: string;
};
export function OutputText(props: MessageTextProps) {
  const { data, date } = props;
  const colors = useThemeToken();
  const type = data.type;
  const { bgColor, color, icon } = useMemo(() => {
    if (!data.content) return {};
    if (data.type === "info") {
      return {
        bgColor: "#1D3245",
        color: "#b2d4f4",
        icon: <InfoCircleOutlined />,
      };
    }
    let infoMap = {
      error: { token: "Error", icon: <CloseCircleOutlined /> },
      log: { token: undefined, icon: <MessageOutlined /> },
      warn: { token: "Warning", icon: <WarningOutlined /> },
    } as const;
    const { icon, token } = (infoMap as any)[type];
    if (!token) return { icon };
    const colorsMap = colors as any as Record<string, string>;
    return {
      bgColor: colorsMap["color" + token + "BgHover"],
      color: colorsMap["color" + token + "TextHover"],
      icon,
    };
  }, [colors, type]);
  const [title, ...content] = data.content;
  return (
    <ListItem
      title={title}
      extra={date}
      icon={icon}
      style={{ backgroundColor: bgColor ?? colors.colorFillQuaternary, color: color }}
    >
      {content.join("\n")}
    </ListItem>
  );
}

export const MSG_TEXT_TYPE_OPTIONS: { key: string; title: string; icon: ReactNode }[] = [
  { title: "日志", key: "log", icon: <MessageOutlined /> },
  { title: "警告", key: "warn", icon: <WarningOutlined /> },
  { title: "错误", key: "error", icon: <CloseCircleOutlined /> },
  { title: "信息", key: "info", icon: <InfoCircleOutlined /> },
];
