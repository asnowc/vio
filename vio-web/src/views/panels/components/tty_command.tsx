import { useAsync } from "@/hooks/async.ts";
import { useDebounceThrottle } from "@/hooks/useDebounceThrottle.ts";
import { useThemeToken } from "@/services/AppConfig.ts";
import { useVioApi } from "@/services/VioApi.ts";
import { TtyInputsReq } from "@asla/vio/client";
import { toErrorStr } from "evlib";
import { message, Modal, Select } from "antd";
import React, { CSSProperties, useEffect, useState } from "react";
interface TtyCommandVo {
  args?: { key: string; config: TtyInputsReq }[];
  ttyId: number;

  command: string;
  description?: string;
  label?: string;
  value: string;
}
export function TtyCommandBoard(props: { ttyId?: number; onClose?: () => void; style?: CSSProperties }) {
  const { style, ttyId, onClose } = props;
  const { tty } = useVioApi();
  const token = useThemeToken();
  const [searchText, setSearchText] = useState<string>("");
  const {
    loading,
    run: refreshCmdList,
    res: cmdList,
  } = useAsync(async (): Promise<TtyCommandVo[] | undefined> => {
    const res = await tty.serverApi?.getTtyCommands({ ttyId, search: searchText });
    return res?.list.map(
      (item): TtyCommandVo => ({
        label: item.description,
        value: item.command,
        command: item.command,
        ttyId: item.ttyId,
        description: item.description,
        args: item.args ? Object.entries(item.args).map((item) => ({ key: item[0], config: item[1] })) : undefined,
      }),
    );
  });
  const onExecCommand = async (e: TtyCommandVo) => {
    onClose?.();
    const args = e.args;
    if (!tty.serverApi) return;
    let result: any;
    if (!args || args.length === 0) {
      try {
        result = await tty.serverApi.execCommand(e.ttyId, e.command);
      } catch (error) {
        message.error(toErrorStr(error));
      }
    } else {
    }
  };
  const run = useDebounceThrottle(refreshCmdList, 60);
  useEffect(() => run(), [searchText, ttyId]);
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.code) {
      case "Enter":
        break;
      case "ArrowDown":
        break;
      case "Tab":
        break;
      case "ArrowUp":
        break;
      case "Escape":
        onClose?.();
        break;
      default:
        break;
    }
  };
  return (
    <div style={style}>
      <Select<string, TtyCommandVo>
        suffixIcon={false}
        onKeyDown={onKeyDown}
        open
        loading={loading}
        showSearch
        filterOption={false}
        placeholder="搜索命令"
        onSearch={setSearchText}
        options={cmdList}
        onChange={(value, option) => onExecCommand?.(option as TtyCommandVo)}
        style={{ width: "100%" }}
        optionRender={(item, b) => {
          const cmd = item.data;
          let argsInfo: string;
          if (cmd.args?.length) {
            if (cmd.args.length === 1) argsInfo = cmd.args[0].key;
            else argsInfo = cmd.args.length + " 个参数";
          } else argsInfo = "";
          return (
            <div>
              <flex-row style={{ justifyContent: "space-between" }}>
                <span>{cmd.command}</span>
                <span>{argsInfo}</span>
              </flex-row>
              <div style={{ color: token.colorTextSecondary }}>{cmd.description}</div>
            </div>
          );
        }}
        onBlur={onClose}
      />
    </div>
  );
}

export function CommandExecModal(props: { command?: TtyCommandVo; open?: boolean; onClose?(): void }) {
  const { command, onClose, open } = props;
  const title = command?.description ?? command?.command;
  return <Modal open={open} onCancel={onClose} title={title}></Modal>;
}
