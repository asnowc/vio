import { useAntdStatic } from "@/hooks/msg.ts";
import { useViewApi } from "@/services/ViewApi.ts";
import { RedoOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import React from "react";

export function LayoutControl() {
  const { message } = useAntdStatic();
  const viewApi = useViewApi();
  const onSave = () => {
    viewApi.saveLayout();
    message.success("已保存");
  };
  const onReload = () => {
    const res = viewApi.restoreLayout();
    if (res) message.success("已恢复");
    else message.info("缓存中没有布局");
  };
  return (
    <flex-col>
      <Tooltip title="保存布局" placement="left">
        <Button type="text" icon={<SaveOutlined />} onClick={onSave}></Button>
      </Tooltip>
      <Tooltip title="恢复布局" placement="left">
        <Button type="text" icon={<RedoOutlined />} onClick={onReload}></Button>
      </Tooltip>
    </flex-col>
  );
}
