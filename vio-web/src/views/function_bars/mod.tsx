import React, { PropsWithChildren } from "react";
import { BugOutlined, CodeOutlined, DashboardOutlined } from "@ant-design/icons";
import { Tooltip, Dropdown, MenuProps } from "antd";
import { useViewApi } from "@/services/ViewApi.ts";
import { ConnectControl, LayoutControl } from "./actions/mod.ts";
import { TtyBar, DebugBar, ChartBar } from "./panels/mod.ts";
import { useThemeToken } from "@/services/AppConfig.ts";
import { useListenableData } from "@/hooks/event.ts";
import { DEV_MODE } from "@/const.ts";

export function LeftSideBarMenu() {
  const viewApi = useViewApi();

  const openedKey = useListenableData(viewApi.functionOpenedChange, (key) => key, viewApi.functionOpened);
  const colors = useThemeToken();
  return (
    <flex-col
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
        {/* //TODO: DocView 无法动态切换主题  <ThemControl /> */}
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

  const Content = bar?.Content ?? (() => <div>空面板</div>);

  return (
    <Panel title={bar?.title}>
      <Content></Content>
    </Panel>
  );
}
type BarDefine = {
  title: string;
  key: string;
  Icon: React.FC<{ style?: React.CSSProperties }>;
  Content?: React.FC;
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
    Content: TtyBar,
  },
  {
    title: "图表",
    key: "chart",
    Icon: DashboardOutlined,
    Content: ChartBar,
  },
];
if (import.meta.env.MODE === DEV_MODE) {
  functionList.push({
    title: "调试",
    key: "debug",
    Icon: BugOutlined,
    Content: DebugBar,
  });
}
const FUNCTION_KEY_MAP = functionList.reduce(
  (v, item) => {
    v[item.key] = item;
    return v;
  },
  {} as Record<string, BarDefine | undefined>,
);
