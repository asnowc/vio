import React from "react";

export function MaxDimensionTip(props: { max: number }) {
  const { max } = props;
  return <div>最高支持{max}维图</div>;
}
