import React, { PropsWithChildren } from "react";
import { BugOutlined, CodeOutlined, DashboardOutlined, TableOutlined } from "@ant-design/icons";
import { Tooltip, Dropdown, MenuProps } from "antd";
import { useViewApi } from "@/services/ViewApi.ts";
import { ConnectControl, LayoutControl } from "./actions/mod.ts";
import { TtyBar, ChartList, TableList } from "./panels/mod.ts";
import { useThemeToken } from "@/services/AppConfig.ts";
import { useListenableData } from "@/hooks/event.ts";
import { E2E_SELECT_CLASS } from "@/const.ts";
import { ThemControl } from "./actions/ThemeControl.tsx";

export function LeftSideBarMenu() {
  const viewApi = useViewApi();

  const openedKey = useListenableData(viewApi.functionOpenedChange, (key) => key, viewApi.functionOpened);
  const colors = useThemeToken();
  return (
    <flex-col
      class={`${E2E_SELECT_CLASS.fn_bar_menu}`}
      style={{
        gap: 12,
        width: 38,
        height: "100%",
        alignItems: "center",
        fontSize: 18,
        padding: "12px 0",
        boxSizing: "border-box",
      }}
    >
      {functionList.map(({ Icon, title, key }) => (
        <Tooltip placement="right" title={title} key={title}>
          <div
            style={{
              cursor: "pointer",
              color: openedKey === key ? undefined : colors.colorTextSecondary,
            }}
            onClick={() => viewApi.openFunctionBar(openedKey === key ? undefined : key)}
          >
            <Icon />
          </div>
        </Tooltip>
      ))}
      <flex-col style={{ flex: 1, justifyContent: "end", alignItems: "center" }}>
        <ThemControl />
        <LayoutControl />
        <ConnectControl />
      </flex-col>
    </flex-col>
  );
}

function Panel(props: PropsWithChildren<{ title?: string }>) {
  const { title } = props;
  return (
    <div style={{ height: "100%", display: "grid", gridTemplateRows: "30px auto", gap: 12 }}>
      <div style={{ margin: "12px 8px 0" }}>{title}</div>
      {props.children}
    </div>
  );
}

export function LeftSideBar() {
  const viewApi = useViewApi();
  const key = useListenableData(viewApi.functionOpenedChange, (key) => key, viewApi.functionOpened);
  const bar = FUNCTION_KEY_MAP[key ?? ""];

  return <Panel title={bar?.title}>{bar?.content ?? <div>空面板</div>}</Panel>;
}
type BarDefine = {
  title: string;
  key: string;
  Icon: React.FC<{ style?: React.CSSProperties }>;
  content?: React.ReactElement;
  memRender?: (props: { style?: React.CSSProperties }) => React.ReactNode;
};
const functionList: BarDefine[] = [
  {
    title: "TTY",
    key: "tty",
    Icon: function TtyFunction({ style }) {
      const items: MenuProps["items"] = [];

      return (
        <div style={{ ...style }}>
          <Dropdown menu={{ items }}>
            <CodeOutlined />
          </Dropdown>
        </div>
      );
    },
    content: <TtyBar />,
  },
  {
    title: "图表",
    key: "chart",
    Icon: DashboardOutlined,
    content: <ChartList />,
  },
  {
    title: "表格",
    key: "table",
    Icon: TableOutlined,
    content: <TableList />,
  },
];

const FUNCTION_KEY_MAP = functionList.reduce(
  (v, item) => {
    v[item.key] = item;
    return v;
  },
  {} as Record<string, BarDefine | undefined>,
);
