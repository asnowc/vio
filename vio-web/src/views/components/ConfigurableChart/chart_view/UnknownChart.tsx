import { Empty } from "antd";
import React from "react";

export function UnknownChart(props: { type?: string }) {
  return (
    <div style={{ height: "100%", paddingTop: 32 }}>
      <Empty description={"未知图表类型：" + props.type} />
    </div>
  );
}
