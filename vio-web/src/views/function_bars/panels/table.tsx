import { useListenable } from "@/hooks/event.ts";
import { mapIterable } from "@/lib/renderLink.ts";
import { useViewApi } from "@/services/ViewApi.ts";
import { RpcConnectStatus, useVioApi } from "@/services/VioApi.ts";
import { Button, Empty } from "antd";
import React from "react";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useForceUpdate } from "@/hooks/forceUpdate.ts";

export function TableBar() {
  const viewApi = useViewApi();
  const { chart } = useVioApi();
  const forceUpdate = useForceUpdate();
  useListenable(chart.createObjEvent, forceUpdate);
  useListenable(chart.deleteObjEvent, forceUpdate);

  const list = chart.getTableSampleList();

  const itemList = mapIterable(list, (item) => {
    const Icon = QuestionCircleOutlined;
    const onClick = () => {
      const panelApi = viewApi.getOpenedTablePanel(item.id);
      if (panelApi) panelApi.focus();
      else viewApi.openTablePanel(item.id, item.name);
    };
    return (
      <Button key={item.id} type="text" onClick={onClick}>
        <flex-row style={{ flex: 1, gap: 8 }}>
          <Icon />
          {item.name ?? item.id}
        </flex-row>
      </Button>
    );
  });

  return (
    <div style={{ padding: 8 }}>
      <flex-col>{itemList.length > 0 ? itemList : <Empty />}</flex-col>
    </div>
  );
}
