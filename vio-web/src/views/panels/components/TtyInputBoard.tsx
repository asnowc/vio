import React, { ReactNode, useMemo, useReducer, useRef, useState } from "react";
import { Badge, Empty, Space, Switch, Tabs, TabsProps } from "antd";
import { TtyInputMsg, useVioApi, TtyClientAgent } from "@/services/VioApi.ts";
import { useListenable, useListenableData } from "@/hooks/event.ts";
import { TtyItem } from "./tty/InputItem.tsx";
import { INPUT_TYPE_INFO } from "./tty/const.tsx";
import { useAntdStatic } from "@/hooks/msg.ts";
import { TtyInputReq } from "@asla/vio/client";
import { useAsync } from "@/hooks/async.ts";
import { E2E_SELECT_CLASS } from "@/const.ts";

export type TtyInputBoardProps = {
  ttyAgent: TtyClientAgent;
  visible?: boolean;
};
export function TtyInputBoard(props: TtyInputBoardProps) {
  const { ttyAgent, visible = true } = props;
  const { dataList, resolveInput, onInputEnableChange, readEnable, connected } = useTtyData(ttyAgent, visible);
  const dataGroup: InputReqGroup = useMemo(() => {
    return Object.groupBy(dataList, (item) => item.req.type ?? "unknown") as InputReqGroup;
  }, [dataList]);

  const tabItem = useMemo(() => {
    const INPUT_TYPES: {
      key: string;
      icon: ReactNode;
      name: string;
      data?: TtyInputMsg[];
    }[] = [
      { ...INPUT_TYPE_INFO.all, data: dataList as any as TtyInputMsg[] },
      { ...INPUT_TYPE_INFO.text, data: dataGroup.text },
      { ...INPUT_TYPE_INFO.select, data: dataGroup.select },
      { ...INPUT_TYPE_INFO.confirm, data: dataGroup.confirm },
      { ...INPUT_TYPE_INFO.file, data: dataGroup.file },
    ];
    const res: TabsProps["items"] = INPUT_TYPES.map((item) => {
      const data = item.data ?? [];
      const children = data.length ? (
        data.map((item) => {
          return (
            <TtyItem
              inputReq={item}
              key={item.key}
              date={new Date(item.date).toLocaleTimeString()}
              onSend={(value) => resolveInput(item.key, value)}
            ></TtyItem>
          );
        })
      ) : (
        <Empty />
      );
      return {
        key: item.key,
        label: (
          <Badge size="small" count={item.data?.length}>
            <Space>
              {item.icon}
              {item.name}
            </Space>
          </Badge>
        ),
        children: <flex-col style={{ gap: 4, marginBottom: 8 }}>{children}</flex-col>,
      };
    });
    return res;
  }, [dataList, dataGroup]);
  const { loading: readEnableLoading, run: onInputRequestChange } = useAsync(onInputEnableChange);

  return (
    <flex-row
      class={E2E_SELECT_CLASS.panels.tty_input}
      style={{ height: "100%", overflow: "hidden", padding: "0 8px" }}
    >
      <Tabs
        size="small"
        items={tabItem}
        tabBarGutter={14}
        style={{ width: "100%" }}
        tabBarExtraContent={
          <Space>
            接收输入请求
            <Switch
              disabled={!connected}
              loading={readEnableLoading}
              checked={readEnable}
              onChange={onInputRequestChange}
            />
          </Space>
        }
      />
    </flex-row>
  );
}

interface InputReqGroup {
  text?: Readonly<TtyInputMsg<TtyInputReq.Text>>[];
  select?: Readonly<TtyInputMsg<TtyInputReq.Select>>[];
  confirm?: Readonly<TtyInputMsg<TtyInputReq.Confirm>>[];
  file?: Readonly<TtyInputMsg<TtyInputReq.File>>[];
  unknown?: Readonly<TtyInputMsg>[];
}

function useTtyData(ttyAgent: TtyClientAgent, visible: boolean) {
  const vioApi = useVioApi();
  const { message } = useAntdStatic();
  const ttyId = ttyAgent.ttyId;

  const connected = useListenableData(vioApi.statusChange, () => vioApi.connected, vioApi.connected);

  function genTtyMsg(): Readonly<TtyInputMsg>[] {
    const list: Readonly<TtyInputMsg>[] = new Array(ttyAgent.readingSize);
    let i = ttyAgent.readingSize - 1; //翻转
    for (const item of ttyAgent.forEachReading()) list[i--] = item;
    return list;
  }
  const [dataList, updateDataList] = useReducer(genTtyMsg, undefined, genTtyMsg);
  const ttyApi = vioApi.tty;
  useListenable(ttyApi.readingChangeEvent, ({ id: index }) => {
    if (!visible) return;
    if (index !== ttyId) return;
    updateDataList();
  });
  const isFirst = useRef(true);
  useMemo(() => {
    if (isFirst.current) return;
    else isFirst.current = false;
    if (visible) updateDataList();
  }, [visible]);
  const readEnable = useListenableData(
    ttyApi.readEnableChangeEvent,
    (data, before) => {
      if (data.id === ttyId) {
        if (data.passive && ttyAgent.readEnable === false) {
          message.error("输入权被夺取");
        }
      }
      return ttyAgent.readEnable;
    },
    ttyAgent.readEnable,
  );

  const onInputEnableChange = (enable: boolean): Promise<boolean> => {
    return ttyApi.setTtyReadEnable(ttyAgent.ttyId, enable);
  };

  const resolveInput = (id: number, value: number) => {
    const exist = ttyApi.get(ttyId)!.resolveReading(id, value);
    if (!exist) message.error("输入请求的 id 不存在");
  };

  return { dataList, resolveInput, onInputEnableChange, readEnable, connected };
}
