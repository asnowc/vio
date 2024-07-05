import React, { useMemo, useState } from "react";
import "dockview/dist/styles/dockview.css";
import { DockviewReadyEvent, DockviewReact } from "dockview";
import panels from "./panels/mod.ts";
import { LeftSideBarMenu, LeftSideBar } from "./function_bars/mod.tsx";
import { DefaultTab } from "./tabs/mod.ts";
import "@/lib/echarts.ts";
import { EchartsConfigProvider } from "@/lib/echarts.ts";
import { DockViewApiProvider, ViewApi } from "@/services/ViewApi.ts";
import { VioRpcApi, VioStateProvider } from "@/services/VioApi.ts";
import { AppThemeName, useExtendsAntdTheme, useThemeToken } from "@/services/AppConfig.ts";
import { SplitLayout, SplitPanelConfig } from "@/lib/dockview.tsx";
import { useListenableData } from "@/hooks/event.ts";

const vioState = new VioRpcApi();

export const DockView = function DockView(props: { theme?: AppThemeName }) {
  const dark = props.theme === "dark";
  const [viewApi, setViewApi] = useState<ViewApi>();
  const onReady = (e: DockviewReadyEvent) => {
    const viewApi = new ViewApi(e.api);
    setViewApi(viewApi);
  };

  const colors = useThemeToken();
  const echartsTheme = useExtendsAntdTheme();
  const openedKey = useListenableData(
    viewApi?.functionOpenedChange,
    (functionOpened) => functionOpened,
    viewApi?.functionOpened,
  );
  const splitPanels = useMemo((): SplitPanelConfig[] => {
    const dockview: SplitPanelConfig = {
      id: "right",
      children: <DockviewReact onReady={onReady} defaultTabComponent={DefaultTab} components={panels} />,
    };
    if (openedKey) {
      return [{ id: "left", children: <LeftSideBar />, size: 400, minimumSize: 200 }, dockview];
    }
    return [dockview];
  }, [openedKey]);
  return (
    <VioStateProvider value={vioState}>
      <DockViewApiProvider value={viewApi!}>
        <EchartsConfigProvider theme={echartsTheme}>
          <div
            className={dark ? "dockview-theme-dark" : "dockview-theme-light"}
            style={{
              display: "grid",
              height: "100%",
              gridTemplateColumns: "38px auto",
              backgroundColor: colors.colorBgBase,
              color: colors.colorText,
              overflow: "hidden",
              fontSize: colors.fontSize,
            }}
          >
            {viewApi ? <LeftSideBarMenu /> : <div></div>}
            <SplitLayout direction="horizontal" style={{ height: "100%" }} panels={splitPanels} />
          </div>
        </EchartsConfigProvider>
      </DockViewApiProvider>
    </VioStateProvider>
  );
};
