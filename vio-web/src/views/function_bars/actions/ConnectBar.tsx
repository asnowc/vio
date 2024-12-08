import { Tooltip } from "antd";
import { useEffect, useMemo, useRef } from "react";
import { RpcConnectStatus, useVioApi } from "@/services/VioApi.ts";
import React from "react";
import { useAppConfig, useThemeToken } from "@/services/AppConfig.ts";
import { LoadingOutlined } from "@ant-design/icons";
import { useListenableData } from "@/hooks/event.ts";
import { useAntdStatic } from "@/hooks/msg.ts";

export function ConnectControl() {
  const { immediatelyRetry, status, retryCount, disconnect } = useRpcConnect();
  const colors = useThemeToken();
  useMemo(() => {}, [status]);

  const STATUS_INFO = {
    0: {
      title: "已断开, 点击立即重连",
      element: (
        <div style={{ padding: 4, cursor: "pointer" }} onClick={() => immediatelyRetry()}>
          <div style={{ backgroundColor: colors.colorError, width: 10, height: 10, borderRadius: 5 }}></div>
        </div>
      ),
    },
    1: {
      title: "连接中",
      element: <LoadingOutlined />,
    },
    2: {
      title: "已连接，点击断开连接",
      element: (
        <div style={{ padding: 4, cursor: "pointer" }} onClick={disconnect}>
          <div style={{ backgroundColor: colors.colorSuccess, width: 10, height: 10, borderRadius: 5 }}></div>
        </div>
      ),
    },
  } satisfies Record<string, { title: string; element?: React.ReactNode }>;

  const statusInfo = STATUS_INFO[status];

  return (
    <Tooltip title={statusInfo.title} placement="left">
      {statusInfo.element}
    </Tooltip>
  );
}

function useStatusChange(status: number, onChange: (before: number) => void) {
  const bef = useRef<number>();
  useMemo(() => {
    if (bef.current !== undefined) onChange(bef.current);
    bef.current = status;
  }, [status]);
}
function useRpcConnect() {
  const vioApi = useVioApi();
  const appConfig = useAppConfig();
  const connectConfig = appConfig.rpcConnect;
  const { message } = useAntdStatic();

  function connect() {
    return vioApi.connect(connectConfig.connectUrl).then(() => {
      autoRetry.retryCount = 0;
    });
  }
  const autoRetry = useMemo(() => {
    return new AutoRetry(connect, {
      maxRetry: connectConfig.reconnectTryMax < 0 ? Infinity : connectConfig.reconnectTryMax,
      waitTime: connectConfig.wait,
    });
  }, []);
  const manualDisconnectRef = useRef<boolean>(false);

  useEffect(() => {
    if (connectConfig.autoConnect) connect();
  }, []);
  const status = useListenableData(
    vioApi.statusChange,
    (status, before) => {
      if (status === RpcConnectStatus.disconnected) {
        if (before === RpcConnectStatus.connected) message.info("连接已断开");
        if (!manualDisconnectRef.current) autoRetry.onFail();
      }
      return vioApi.status;
    },
    vioApi.status,
  );

  return {
    immediatelyRetry: () => {
      manualDisconnectRef.current = false;
      autoRetry.immediatelyRetry();
    },
    disconnect: () => {
      manualDisconnectRef.current = true;
      vioApi.disconnect();
    },
    status,
    retryCount: autoRetry.retryCount,
  };
}
type AutoRetryOption = { maxRetry?: number; waitTime?: number };
class AutoRetry {
  constructor(
    public onRetry: () => Promise<any> | any,
    opts: AutoRetryOption = {},
  ) {
    this.maxRetry = opts.maxRetry ?? Infinity;
    this.waitTime = opts.waitTime ?? 3000;
  }
  maxRetry: number;
  waitTime: number;
  retryCount: number = 0;
  immediatelyRetry() {
    if (this.#retryWaiting !== undefined) {
      clearTimeout(this.#retryWaiting);
      this.#retryWaiting = undefined;
    }
    this.onRetry();
  }
  #retryWaiting?: number;
  onFail() {
    if (this.#retryWaiting !== undefined) return;
    this.retryCount++;
    if (this.retryCount > this.maxRetry) return;
    if (this.waitTime) {
      this.#retryWaiting = setTimeout(() => this.immediatelyRetry(), this.waitTime);
    } else this.immediatelyRetry();
  }
}
