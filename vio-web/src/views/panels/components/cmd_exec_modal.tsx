import { useVioApi } from "@/services/VioApi.ts";
import { toErrorStr } from "evlib";
import { Form, message, Modal, Tooltip } from "antd";
import React, { useMemo, useState } from "react";
import { renderInputContents } from "./tty/InputItem.tsx";
import { TtyCommandInfo } from "@asla/vio/client";
import { useAntdStatic } from "@/hooks/msg.ts";
import { useAsync } from "@/hooks/async.ts";

function CommandExecModal(props: {
  command?: TtyCommandInfo;
  open?: boolean;
  onSubmit?: (values: any) => any;
  onClose?(): void;
}) {
  const { command, onClose, open } = props;
  const [form] = Form.useForm();
  const { loading, run: onSubmit } = useAsync(async () => {
    const values = await form.validateFields();
    await props.onSubmit?.(values);
    onClose?.();
  });
  let title = "输入参数";
  if (command) title += ": " + (command.description ?? command.command);

  useMemo(() => {
    if (open) form.resetFields();
  }, [open]);
  return (
    <Modal open={open} onCancel={onClose} title={title} onOk={onSubmit} okText="执行" confirmLoading={loading}>
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

  const { message } = useAntdStatic();
  const { tty } = useVioApi();
  const sendExec = async (ttyId: number, cmd: string, args?: Record<string, any>) => {
    if (!tty.serverApi) return;
    let result: any;
    try {
      result = await tty.serverApi.execCommand(ttyId, cmd, args);
    } catch (error) {
      message.error(toErrorStr(error));
      throw error;
    }
  };
  const execCommand = async (e: TtyCommandInfo) => {
    const args = e.args;
    if (!args || args.length === 0) await sendExec(e.ttyId, e.command);
    else setExecCmdOpen(e);
  };
  const modal = (
    <CommandExecModal
      open={execCmdOpen !== undefined}
      command={execCmdOpen}
      onSubmit={(args) => {
        if (!execCmdOpen) return;
        return sendExec(execCmdOpen.ttyId, execCmdOpen.command, args);
      }}
      onClose={() => setExecCmdOpen(undefined)}
    />
  );
  return { slot: modal, execCommand };
}
