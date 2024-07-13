import { TtyInputMsg } from "@/services/VioApi.ts";
import { ListItem } from "@/views/components/ListItem.tsx";
import React from "react";
import { INPUT_TYPE_INFO } from "./const.tsx";
import { InputText } from "./InputText.tsx";
import { InputSelect } from "./InputSelect.tsx";
import { TtyInputReq } from "@asla/vio/client";
import { Button, Space } from "antd";
import { useThemeToken } from "@/services/AppConfig.ts";
import { InputFile } from "./InputFile.tsx";

export function TtyItem(props: { inputReq: TtyInputMsg; date?: string; onSend?: (value: any) => void }) {
  const { inputReq, date, onSend } = props;
  const { req } = inputReq;
  switch (req.type) {
    case "file":
      return <InputFile req={req} date={date} onSend={onSend} />;
    case "confirm":
      return <InputConfirm req={req} date={date} onSend={onSend} />;
    case "select":
      return <InputSelect req={req} date={date} onSend={onSend} />;
    case "text":
      return <InputText req={req} date={date} onSend={onSend} />;
    default:
      return <ListItem contentIndent={false} title={"未知类型"} extra={date} />;
  }
}

type InputConfirmProps = {
  req: TtyInputReq.Confirm;
  date?: string;
  onSend?: (value: boolean) => void;
};
function InputConfirm(props: InputConfirmProps) {
  const { req, date, onSend } = props;
  const { colorPrimary } = useThemeToken();
  return (
    <ListItem contentIndent={false} icon={INPUT_TYPE_INFO.confirm.icon} title={req.title} extra={date}>
      <Space size="middle" style={{ margin: 4 }}>
        <Button size="small" onClick={() => onSend?.(true)} style={{ borderColor: colorPrimary }}>
          是
        </Button>
        <Button size="small" onClick={() => onSend?.(false)}>
          否
        </Button>
      </Space>
    </ListItem>
  );
}
