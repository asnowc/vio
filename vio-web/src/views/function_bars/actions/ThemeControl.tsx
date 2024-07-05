import { useAppConfig } from "@/services/AppConfig.ts";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import React from "react";
import { useListenableData } from "@/hooks/event.ts";
import { Button, Tooltip } from "antd";
export const ThemControl = function ThemControl() {
  const config = useAppConfig();
  const themeName = useListenableData(config.themeNameChange, (theme) => theme, config.themeName);
  const isDark = themeName === "dark";
  return (
    <Tooltip title={isDark ? "切换高亮主题" : "切换黑暗主题"}>
      <Button
        type="text"
        onClick={() => {
          config.changeTheme(isDark ? "light" : "dark");
        }}
        icon={isDark ? <MoonOutlined /> : <SunOutlined />}
      ></Button>
    </Tooltip>
  );
};
