import { Timeline, TimelineItemProps } from "antd";
import React, { useMemo } from "react";
import { ChartCommonProps } from "./type.ts";
import { LoadingOutlined } from "@ant-design/icons";
import { useThemeToken } from "@/services/AppConfig.ts";
//TODO: 实现待定
export function TimelineChart(props: ChartCommonProps<number | number[]>) {
  const { chartMeta, dimensionIndexNames, dimensionNames, data } = props;
  const { colorTextDescription } = useThemeToken();
  const items = useMemo((): TimelineItemProps[] | undefined => {
    let current: number;
    if (typeof data === "number") current = data;
    else if (data instanceof Array) current = data[data.length - 1];
    else current = 0;

    const indexNames = dimensionIndexNames ?? [];
    const timelineNodeNames = indexNames[0] ?? [];
    const done = indexNames[1] ?? [];

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
  }, [data, dimensionIndexNames, colorTextDescription]);
  return (
    <div style={{ padding: 12 }}>
      <Timeline items={items}></Timeline>
    </div>
  );
}
