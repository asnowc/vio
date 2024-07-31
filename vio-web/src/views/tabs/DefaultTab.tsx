import { CloseOutlined, CodeOutlined, DashboardOutlined, TableOutlined } from "@ant-design/icons";
import { IDockviewPanelHeaderProps } from "dockview";
import React, { CSSProperties, FC } from "react";
export interface TabInfo {
  TabIcon?: FC | string;
}
const TAB_ICONS: Record<string, FC | undefined> = {
  CodeOutlined: CodeOutlined,
  DashboardOutlined: DashboardOutlined,
  TableOutlined: TableOutlined,
};
export function DefaultTab({ api, containerApi, params: props }: IDockviewPanelHeaderProps<TabInfo>) {
  const { TabIcon } = props;

  let Icon: FC<{ style?: CSSProperties }> | undefined = typeof TabIcon === "function" ? TabIcon : TAB_ICONS[TabIcon!];

  switch (typeof props.TabIcon) {
    case "string": {
      Icon = TAB_ICONS[props.TabIcon];
      break;
    }
    case "function": {
      Icon = props.TabIcon;
    }
  }
  return (
    <flex-row
      style={{
        height: "100%",
        padding: "4px 8px",
        boxSizing: "border-box",
        overflow: "hidden",
        gap: 6,
        alignItems: "center",
      }}
    >
      {Icon && <Icon style={{ fontSize: 16 }} />}
      <span style={{ textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{api.title}</span>
      <span onClick={() => api.close()}>
        <CloseOutlined />
      </span>
    </flex-row>
  );
}
