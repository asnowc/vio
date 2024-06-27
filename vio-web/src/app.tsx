import React, { useEffect } from "react";
import { ConfigProvider, theme, message, notification } from "antd";
import antdLangZh from "antd/locale/zh_CN.js";
import { Locale } from "antd/lib/locale/index.js";
import { DockView } from "./views/root.tsx";
import "./styles/index.css";
import { AntdStaticProvider } from "./hooks/msg.ts";
import { AppConfigProvider, AppConfig } from "./services/AppConfig.ts";
import { DEV_MODE } from "./const.ts";
import { useAsync } from "./hooks/async.ts";

const COLOR_PRIMARY = "#b25cfe";
export default function Root() {
  const messageInstance = message.useMessage();
  const notice = notification.useNotification();
  const { loading, run, res: appConfig } = useAsync(() => AppConfig.load());
  useEffect(() => {
    run();
  }, []);
  if (import.meta.env.MODE === DEV_MODE && appConfig) console.warn("Root render");

  const themeName = appConfig?.themeName ?? "dark";
  const dark = themeName === "dark";

  const antAlgorithm = [theme.compactAlgorithm];
  if (dark) antAlgorithm.push(theme.darkAlgorithm);

  return (
    <ConfigProvider
      locale={antdLangZh as any as Locale}
      theme={{
        components: {
          Tooltip: {
            fontSize: 12,
            controlHeight: 0,
            paddingSM: 6,
            paddingLG: 8,
          },
        },
        token: {
          colorPrimary: COLOR_PRIMARY,
          colorInfo: COLOR_PRIMARY,
          colorBgBase: dark ? "#181818" : "#ffffff",
          borderRadius: 4,

          padding: 12,
          paddingMD: 16,
          paddingLG: 20,
          paddingXL: 24,
          margin: 12,
          marginMD: 16,
          marginLG: 20,
          marginXL: 24,
        },
        algorithm: antAlgorithm,
      }}
    >
      <AntdStaticProvider value={{ message: messageInstance[0], notice: notice[0] }}>
        {appConfig && (
          <AppConfigProvider value={appConfig}>
            <DockView />
          </AppConfigProvider>
        )}
      </AntdStaticProvider>
      {messageInstance[1]}
      {notice[1]}
    </ConfigProvider>
  );
}
