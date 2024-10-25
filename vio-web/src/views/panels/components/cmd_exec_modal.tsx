import { useVioApi } from "@/services/VioApi.ts";
import { toErrorStr } from "evlib";
import { Form, message, Modal, Tooltip } from "antd";
import React, { useMemo, useState } from "react";
import { renderInputContents } from "./tty/InputItem.tsx";
import { TtyCommandInfo } from "@asla/vio/client";

function CommandExecModal(props: {
  command?: TtyCommandInfo;
  open?: boolean;
  onSubmit?: (values: any) => void;
  onClose?(): void;
}) {
  const { command, onClose, open } = props;
  const [form] = Form.useForm();

  let title = "输入参数";
  if (command) title += ": " + (command.description ?? command.command);
  const onSubmit = async () => {
    const values = await form.validateFields();
    props.onSubmit?.(values);
  };
  useMemo(() => {
    if (open) form.resetFields();
  }, [open]);
  return (
    <Modal open={open} onCancel={onClose} title={title} onOk={onSubmit} okText="执行">
      <Form form={form}>
        {command?.args?.map(({ type, key, required }) => {
          const label = type?.title ? <Tooltip title={type.title}>{key}</Tooltip> : key;
          return (
            <Form.Item key={key} name={key} label={label} required={required} rules={[{ required }]}>
              {renderInputContents(type)}
            </Form.Item>
          );
        })}
      </Form>
    </Modal>
  );
}

export function useCommandBoard() {
  const [execCmdOpen, setExecCmdOpen] = useState<TtyCommandInfo>();
  const { tty } = useVioApi();
  const execCommand = async (e: TtyCommandInfo) => {
    const args = e.args;
    if (!tty.serverApi) return;
    if (!args || args.length === 0) {
      let result: any;
      try {
        result = await tty.serverApi.execCommand(e.ttyId, e.command);
      } catch (error) {
        message.error(toErrorStr(error));
      }
    } else {
      setExecCmdOpen(e);
    }
  };
  const modal = (
    <CommandExecModal
      open={execCmdOpen !== undefined}
      command={execCmdOpen}
      onSubmit={(args) => {
        if (!execCmdOpen) return;
        tty.serverApi?.execCommand(execCmdOpen.ttyId, execCmdOpen.command, args);
        setExecCmdOpen(undefined);
      }}
      onClose={() => setExecCmdOpen(undefined)}
    />
  );
  return { slot: modal, execCommand };
}
