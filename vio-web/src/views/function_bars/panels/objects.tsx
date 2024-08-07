import { useListenable } from "@/hooks/event.ts";
import { mapIterable } from "@/lib/renderLink.ts";
import { useViewApi } from "@/services/ViewApi.ts";
import { useVioApi } from "@/services/VioApi.ts";
import { Button, Empty } from "antd";
import React from "react";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useForceUpdate } from "@/hooks/forceUpdate.ts";
import { VioObject } from "@asla/vio/client";

function ObjectList(props: { type: string; onClick(item: VioObject): void }) {
  const { type, onClick } = props;
  const viewApi = useViewApi();
  const { chart } = useVioApi();
  const forceUpdate = useForceUpdate();
  useListenable(chart.createObjEvent, forceUpdate);
  useListenable(chart.deleteObjEvent, forceUpdate);

  const list = chart.getSampleList({ type: type });

  const itemList = mapIterable(list, (item) => {
    const Icon = QuestionCircleOutlined;
    return (
      <Button key={item.id} type="text" onClick={() => onClick(item)}>
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
export function ChartList() {
  const viewApi = useViewApi();
  const onClick = (obj: VioObject) => {
    const panelApi = viewApi.getOpenedChartPanel(obj.id);
    if (panelApi) panelApi.focus();
    else viewApi.openChartPanel(obj.id, obj.name);
  };
  return <ObjectList type="chart" onClick={onClick} />;
}
export function TableList() {
  const viewApi = useViewApi();
  const onClick = (obj: VioObject) => {
    const panelApi = viewApi.getOpenedTablePanel(obj.id);
    if (panelApi) panelApi.focus();
    else viewApi.openTablePanel(obj.id, obj.name);
  };
  return <ObjectList type="table" onClick={onClick} />;
}
export function StepTaskList() {
  const viewApi = useViewApi();
  const onClick = (obj: VioObject) => {
    const panelApi = viewApi.getOpenedStepTaskPanel(obj.id);
    if (panelApi) panelApi.focus();
    else viewApi.openStepTaskPanel(obj.id, obj.name);
  };
  return <ObjectList type="stepTask" onClick={onClick} />;
}
