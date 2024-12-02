import { useVioApi } from "@/services/VioApi.ts";
import { toErrorStr } from "evlib";
import { Form, FormInstance, Modal, Tooltip } from "antd";
import React, { useMemo, useState } from "react";
import { renderInputContents } from "./tty/InputItem.tsx";
import { TtyCommandInfo } from "@asla/vio/client";
import { useAntdStatic } from "@/hooks/msg.ts";
import { useAsync } from "@/hooks/async.ts";

function CommandExecModal(props: {
  command?: TtyCommandInfo;
  open?: boolean;
  onSubmit?: (values: any) => any;
  onCancel?(): void;
  form: FormInstance;
}) {
  const { command, onCancel, open, form } = props;
  const { loading, run: onSubmit } = useAsync(async () => {
    const values = await form.validateFields();
    await props.onSubmit?.(values);
  });
  let title = "输入参数";
  if (command) title += ": " + (command.description ?? command.command);

  return (
    <Modal open={open} onCancel={onCancel} title={title} onOk={onSubmit} okText="执行" confirmLoading={loading}>
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
  const cache = useMemo(() => new History(100), []);
  const [form] = Form.useForm();
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
    else {
      form.resetFields();
      const history = cache.get(e.command);
      if (history) form.setFieldsValue(cache.get(e.command));
      console.log(history);

      setExecCmdOpen(e);
    }
  };
  const modal = (
    <CommandExecModal
      open={execCmdOpen !== undefined}
      command={execCmdOpen}
      onSubmit={(args) => {
        if (!execCmdOpen) return;
        return sendExec(execCmdOpen.ttyId, execCmdOpen.command, args).then(() => {
          setExecCmdOpen(undefined);
          cache.add(execCmdOpen.command, args);
        });
      }}
      onCancel={() => {
        if (execCmdOpen) cache.add(execCmdOpen.command, form.getFieldsValue());
        setExecCmdOpen(undefined);
      }}
      form={form}
    />
  );
  return { slot: modal, execCommand };
}
class History {
  constructor(readonly maxLength: number) {}
  private data = new Map<string, any>();
  private deleteFirst() {
    for (const key of this.data.keys()) {
      this.data.delete(key);
      break;
    }
  }
  add(key: string, args: any) {
    if (this.data.has(key)) {
      this.data.delete(key);
    }
    this.data.set(key, args);
    if (this.data.size > this.maxLength) {
      this.deleteFirst();
    }
  }
  get(key: string) {
    return this.data.get(key);
  }
}
