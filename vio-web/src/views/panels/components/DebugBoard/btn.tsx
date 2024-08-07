import { Button, Tooltip } from "antd";
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  RollbackOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import React, { ReactNode } from "react";
import { useThemeToken } from "@/services/AppConfig.ts";
import { DebugCommand } from "@asla/vio/client";

export function DebugButtons(props: { paused?: boolean; onClick?(command: DebugCommand): void; extra?: ReactNode[] }) {
  const { onClick = () => {}, paused, extra = [] } = props;
  const { colorBgContainer, colorBorder } = useThemeToken();
  return (
    <flex-row
      style={{
        margin: "2px 4px",
        backgroundColor: colorBgContainer,
        border: "solid 1px " + colorBorder,
        borderRadius: 4,
      }}
    >
      {paused ? (
        <Btn
          title="继续"
          icon={<PlayCircleOutlined />}
          key={DebugCommand.continue}
          onClick={() => onClick(DebugCommand.continue)}
        />
      ) : (
        <Btn
          title="暂停"
          icon={<PauseCircleOutlined />}
          key={DebugCommand.pause}
          onClick={() => onClick(DebugCommand.pause)}
        />
      )}
      <Btn
        title="步过"
        icon={<RollbackOutlined style={{ transform: "scaleY(-1)" }} />}
        key={DebugCommand.next}
        onClick={() => onClick(DebugCommand.next)}
        disabled={!paused}
      />
      <Btn
        title="步入"
        icon={<VerticalAlignBottomOutlined />}
        key={DebugCommand.nextIn}
        onClick={() => onClick(DebugCommand.nextIn)}
        disabled={!paused}
      />
      <Btn
        title="步出"
        icon={<VerticalAlignTopOutlined />}
        key={DebugCommand.nextOut}
        onClick={() => onClick(DebugCommand.nextOut)}
        disabled={!paused}
      />
      {...extra}
    </flex-row>
  );
}

function Btn(props: { title?: string; icon: ReactNode; onClick?(): void; disabled?: boolean }) {
  return (
    <Tooltip title={props.title}>
      <Button icon={props.icon} type="text" onClick={props.onClick} disabled={props.disabled} />
    </Tooltip>
  );
}
