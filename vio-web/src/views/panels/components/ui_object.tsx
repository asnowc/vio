import { type UiButton, UiTag } from "@asla/vio/client";
import { Button, Tag, Tooltip } from "antd";
import React, { FC, ReactNode } from "react";
const createImage = (src: string) => {
  return <img src={src} style={{ height: "22px" }} />;
};

const uiAction: Record<string, FC<{ onAction?(): void; [key: string]: any }>> = {
  button: function UiButton(props: UiButton["props"] & { onAction?(): void }) {
    const { icon: iconUrl, text, type, onAction, disable } = props;
    let icon: ReactNode | undefined;
    if (iconUrl) {
      icon = createImage(iconUrl);
    }
    const btn = (
      <Button icon={icon} type={type as any} onClick={onAction} disabled={disable}>
        {text}
      </Button>
    );
    const tooltip = props.tooltip || (type === "text" && text);
    if (tooltip) {
      return <Tooltip title={tooltip}>{btn}</Tooltip>;
    }
    return btn;
  },
};
const uiOutput: Record<string, FC<{ [key: string]: any }>> = {
  tag: function TableTag(props: UiTag["props"]) {
    return (
      <Tag color={props.color} icon={props.icon ? createImage(props.icon) : undefined}>
        {props.text}
      </Tag>
    );
  },
};
export function VioUi(props: { object: any; onAction?: (key: string) => void }) {
  const { object, onAction } = props;
  if (typeof object === "object") {
    if (uiAction[object.ui]) {
      return React.createElement(uiAction[object.ui], { ...object.props, onAction: () => onAction?.(object.key) });
    } else if (uiOutput[object.ui]) {
      return React.createElement(uiOutput[object.ui], object.props);
    }
    return JSON.stringify(object);
  }
  return object;
}
