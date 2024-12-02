import { useAsync } from "@/hooks/async.ts";
import { useDebounceThrottle } from "@/hooks/useDebounceThrottle.ts";
import { useThemeToken } from "@/services/AppConfig.ts";
import { useVioApi } from "@/services/VioApi.ts";
import { Select } from "antd";
import React, { CSSProperties, useEffect, useState } from "react";
import { TtyCommandInfo } from "@asla/vio/client";
import { E2E_SELECT_CLASS } from "@/const.ts";

export function TtyCommandBoard(props: {
  ttyId?: number;
  showAll?: boolean;
  onExecCommand(cmd: TtyCommandInfo): void;
  onClose?: () => void;
  style?: CSSProperties;
}) {
  const { style, ttyId, onClose, onExecCommand, showAll } = props;
  const { tty } = useVioApi();
  const token = useThemeToken();
  const [searchText, setSearchText] = useState<string>("");
  const {
    loading,
    run: refreshCmdList,
    res: cmdList,
  } = useAsync(async (): Promise<TtyCommandInfo[] | undefined> => {
    const res = await tty.serverApi?.getTtyCommands({ ttyId: showAll ? undefined : ttyId, search: searchText });

    return res?.list.map((item) => ({
      label: item.description,
      value: item.command,
      command: item.command,
      ttyId: item.ttyId,
      description: item.description,
      args: item.args,
    }));
  });

  const run = useDebounceThrottle(refreshCmdList, 60);
  useEffect(() => run(), [searchText, ttyId, showAll]);
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
    <div style={style} className={E2E_SELECT_CLASS.panels.tty_command_board}>
      <Select<string, TtyCommandInfo>
        suffixIcon={false}
        onKeyDown={onKeyDown}
        open
        autoFocus
        loading={loading}
        showSearch
        filterOption={false}
        placeholder="搜索命令"
        onSearch={setSearchText}
        options={cmdList}
        onChange={(value, option) => onExecCommand?.(option as TtyCommandInfo)}
        style={{ width: "100%" }}
        optionRender={(item, b) => {
          const cmd = item.data;
          let argsInfo: string = "参数: ";
          if (cmd.args?.length) {
            if (cmd.args.length === 1) argsInfo += cmd.args[0].key;
            else argsInfo += cmd.args.length;
          } else argsInfo = "";
          return (
            <div>
              <flex-row style={{ justifyContent: "space-between" }}>
                <span>
                  {showAll ? "TTY " + item.data.ttyId + ": " : undefined}
                  {cmd.command}
                </span>
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
