import { theme } from "antd";
import React from "react";
import { PropsWithChildren } from "react";

export function Title(props: PropsWithChildren<{ level: 1 | 2 | 3 | 4 | 5 }>) {
  const { level = 5 } = props;
  const token = theme.useToken().token;
  const fontSize = (token as any)["fontSizeHeading" + level];
  return <span style={{ fontSize, fontWeight: "bold", color: token.colorText }}>{props.children}</span>;
}
