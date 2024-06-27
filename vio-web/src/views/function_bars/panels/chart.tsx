import { useListenable } from "@/hooks/event.ts";
import { mapIterable } from "@/lib/renderLink.ts";
import { useViewApi } from "@/services/ViewApi.ts";
import { useVioApi } from "@/services/VioApi.ts";
import { Button, Empty } from "antd";
import React from "react";
import { CHART_TYPE_RENDER_MAP } from "../../components/ConfigurableChart.tsx";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useForceUpdate } from "@/hooks/forceUpdate.ts";

export function ChartBar() {
  const viewApi = useViewApi();
  const { chart } = useVioApi();
  const forceUpdate = useForceUpdate();
  useListenable(chart.createEvent, forceUpdate);
  useListenable(chart.deleteEvent, forceUpdate);

  const chartList = chart.chartsMap.values();

  const itemList = mapIterable(chartList, (item) => {
    const meta = item.meta;
    const type = meta.chartType;
    const Icon = CHART_TYPE_RENDER_MAP[type]?.Icon ?? QuestionCircleOutlined;
    const title = meta.title ?? item.id;

    const panelApi = viewApi.getOpenedChartPanel(item.id);
    const onClick = () => {
      if (panelApi) panelApi.focus();
      else viewApi.openChartPanel(item.id);
    };
    return (
      <Button key={item.id} type="text" onClick={onClick}>
        <flex-row style={{ flex: 1, gap: 8 }}>
          <Icon />
          {title}
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
interface ChartItem {
  type: string;
}
