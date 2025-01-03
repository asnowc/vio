import { checkType, patchObject, typeChecker, TypeCheckFnCheckResult, TypeCheckOptions } from "evlib";
const { optional, numberRange } = typeChecker;

export type AppThemeName = "dark" | "light";
export interface AppWebConfig {
  themeName: AppThemeName;
  rpcConnect: RpcConnectConfig;
}
export interface RpcConnectConfig {
  /** 连接 websocket 的 url。如果存在，将忽略 connectOrigin、connectProtocol、connectPath */
  connectUrl: string;
  /**
   * 进入页面后是否自动连接
   * @defaultValue true
   */
  autoConnect: boolean;
  /**
   * 意外断开连接后是否自动重新连接尝试的次数。设置为0，将会自动重连，设置位-1 将不限次数。
   * @defaultValue 10
   */
  reconnectTryMax: number;
  /**
   * 自动重新连接等待时间。单位为毫秒。
   * @defaultValue 2000
   */
  wait: number;
}

export type UserAppWebConfig = {
  rpcConnect: Partial<RpcConnectConfig> & {
    /** 连接 websocket 的域。默认位 web 服务器的域 */
    connectHost?: string;
    /** 连接 websocket 的协议，可选 "ws"或 "wss". 默认为 location.protocol 为 http 则为 ws, 否则为 wss */
    connectProtocol?: "ws" | "wss";
    /** 连接 websocket 的路径，默认 "/api/rpc" */
    connectPath?: string;
  };
};
export async function getAppWebConfig(): Promise<AppWebConfig> {
  const config = await fetch("/config.json").then(
    (res) => res.json(),
    (e) => {
      console.error("配置读取失败： ", e);
      return {};
    },
  );
  const { value: userConfig, error } = checkType(
    config,
    {
      themeName: (raw): TypeCheckFnCheckResult => {
        return { value: ["dark", "light"].includes(raw) ? raw : "dark", replace: true };
      },
      rpcConnect: (raw, opts): TypeCheckFnCheckResult => {
        let { value: res1, error } = checkType(
          raw,
          optional({
            connectHost: optional.string,
            connectProtocol: (val: any): TypeCheckFnCheckResult => {
              if ([undefined, null, "ws", "wss"].includes(val)) return;
              return { error: "connectProtocol must be 'ws' of 'wss'" };
            },
            connectPath: optional.string,
            connectUrl: optional.string,
            autoConnect: optional.boolean,
            autoReconnect: optional.boolean,
            tryMax: optional(numberRange(-1)),
            wait: optional(numberRange(0)),
          }),
          opts,
        );
        if (error) return { value: res1 ?? {}, error };
        const {
          connectHost = location.host,
          connectPath = "/api/rpc",
          connectProtocol = location.protocol === "http" ? "ws" : "wss",
          ...reset
        } = res1 ?? ({} as UserAppWebConfig["rpcConnect"]);
        if (reset.connectUrl) return { value: reset, replace: true };
        else {
          const protocol = connectProtocol ? connectProtocol : location.protocol === "http" ? "ws" : "wss";
          reset.connectUrl = `${protocol}://${connectHost}${connectPath}`;
        }
        return { value: reset, replace: true };
      },
    },
    { policy: "delete" },
  );

  const defaultConfig: AppWebConfig = {
    themeName: "dark",
    rpcConnect: {
      connectUrl: `ws://${location.host}/api/rpc`,
      autoConnect: true,
      reconnectTryMax: 10,
      wait: 5000,
    },
  };
  if (error) {
    console.error(JSON.stringify(error));
    return defaultConfig;
  }

  return patchObject<AppWebConfig>(userConfig, defaultConfig);
}
