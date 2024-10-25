import { AppThemeName, AppWebConfig, RpcConnectConfig, getAppWebConfig } from "./app_config/user_json_config.ts";
import { EventTrigger } from "evlib";
import React, { useContext } from "react";

export class AppConfig implements AppWebConfig {
  static async load() {
    const userConfig = await getAppWebConfig();
    return new this(userConfig);
  }
  readonly rpcConnect: RpcConnectConfig;
  themeName: AppThemeName;
  readonly themeNameChange = new EventTrigger<AppThemeName>();
  changeTheme(theme: AppThemeName) {
    if (theme === this.themeName) return;
    this.themeName = theme;
    this.themeNameChange.emit(theme);
  }
  constructor(config: AppWebConfig) {
    this.themeName = config.themeName;
    this.rpcConnect = config.rpcConnect;
  }
}

const appConfigContext = React.createContext<AppConfig>(undefined as any);
export const AppConfigProvider = appConfigContext.Provider;
export function useAppConfig() {
  return useContext(appConfigContext);
}
export type { AppThemeName, AppWebConfig, UserAppWebConfig } from "./app_config/user_json_config.ts";
export * from "./app_config/theme.ts";
