import { useAppConfig } from "@/services/AppConfig.ts";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import React from "react";
import { useListenableData } from "@/hooks/event.ts";
export const ThemControl = function ThemControl() {
  const config = useAppConfig();
  const themeName = useListenableData(config.themeNameChange, (theme) => theme, config.themeName);
  const isDark = themeName === "dark";
  return <div style={{ cursor: "pointer" }}>{isDark ? <MoonOutlined /> : <SunOutlined />}</div>;
};
