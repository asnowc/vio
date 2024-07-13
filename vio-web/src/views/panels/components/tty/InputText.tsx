import { ArrowUpOutlined } from "@ant-design/icons";
import { TtyInputReq } from "@asla/vio/client";
import { Button, Input } from "antd";
import React, { useState } from "react";
import { ListItem } from "@/views/components/ListItem.tsx";
import { INPUT_TYPE_INFO } from "./const.tsx";
const { TextArea } = Input;

export type InputTextProps = {
  req: TtyInputReq.Text;
  date?: string;
  onSend?: (value: string) => void;
};

export function InputText(props: InputTextProps) {
  const { req, date, onSend } = props;
  const [value, setValue] = useState("");
  const title = req.title;
  const placeholder = req.maxLen ? `输入文本，不超过 ${req.maxLen} 个字符` : "输入文本";
  const content = (
    <div>
      <TextArea
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        maxLength={req.maxLen}
        placeholder={placeholder}
        allowClear
        autoSize
      />
      <Button style={{ marginTop: 8 }} icon={<ArrowUpOutlined />} size="small" onClick={() => onSend?.(value)}>
        发送
      </Button>
    </div>
  );

  return (
    <ListItem
      contentIndent={false}
      icon={INPUT_TYPE_INFO[req.type].icon}
      title={title}
      extra={date}
      children={<div style={{ marginBottom: 6 }}>{content}</div>}
    />
  );
}
