import { Timeline, TimelineItemProps } from "antd";
import React, { useContext, useMemo } from "react";
import { ChartCommonProps } from "../type.ts";
import { LoadingOutlined } from "@ant-design/icons";
import { useThemeToken } from "@/services/AppConfig.ts";
import { errorCollector } from "@/services/ErrorLog.ts";
//TODO: 实现待定
export function TimelineChart(props: ChartCommonProps<number | number[]>) {
  const { chartMeta: chartMeta, dataList, dimension, dimensions } = props;
  const { chartType, title } = chartMeta;
  const { colorTextDescription } = useThemeToken();

  const errorCtrl = useContext(errorCollector);
  const data = useMemo(() => {
    const data = dataList[dataList.length - 1]?.data;
    if (typeof data === "number") return data;
    else {
      errorCtrl.error("TimelineChart 图表数据校验不通过");
      return 0;
    }
  }, [dataList]);

  const items = useMemo((): TimelineItemProps[] | undefined => {
    let current: number = data;

    const indexNames = dimensions;
    const timelineNodeNames = indexNames[0].indexNames ?? [];
    const done = indexNames[1].indexNames ?? [];

    let size = timelineNodeNames.length;
    return timelineNodeNames.map((nodeName, index) => {
      const element = (
        <div>
          {nodeName}
          <div style={{ color: colorTextDescription }}>{index < current && done[index + 1]}</div>
        </div>
      );

      if (index === current)
        return {
          color: "blue",
          dot: <LoadingOutlined />,
          children: element,
        };
      else if (index > current) {
        return {
          color: "gray",
          children: element,
        };
      }
      const pass = true;
      return {
        color: pass ? "green" : "red",
        children: element,
      };
    });
  }, [data, dimensions, colorTextDescription]);
  return (
    <div style={{ padding: 12 }}>
      <Timeline items={items}></Timeline>
    </div>
  );
}
