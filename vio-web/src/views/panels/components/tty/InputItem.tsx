import { TtyInputMsg } from "@/services/VioApi.ts";
import { ListItem } from "@/views/components/ListItem.tsx";
import React, { ReactNode } from "react";
import { INPUT_TYPE_INFO } from "./const.tsx";
import { InputText, InputTextContent } from "./InputText.tsx";
import { InputSelect, InputSelectContent } from "./InputSelect.tsx";
import { InputFile, InputFileContent, getInputReqFileResult } from "./InputFile.tsx";
import { TtyInputReq, TtyInputsReq } from "@asla/vio/client";
import { Button, Radio, Space } from "antd";
import { useThemeToken } from "@/services/AppConfig.ts";

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
export function renderInputContents(req: TtyInputsReq): ReactNode {
  switch (req.type) {
    //TODO 目前 InputFileContent 的 onChange() 的参数待处理
    // case "file":
    //   return <InputFileContent req={req} />;
    case "confirm":
      return (
        <Radio.Group>
          <Radio value={true}>是</Radio>
          <Radio value={false}>否</Radio>
        </Radio.Group>
      );
    case "select":
      return <InputSelectContent req={req} />;
    case "text":
      return <InputTextContent req={req} />;
    default:
      return <div>不支持的类型：{req.type}</div>;
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
