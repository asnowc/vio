import { Button, ButtonProps, Tooltip, TooltipProps } from "antd";
import React, { PropsWithChildren } from "react";

export function TooltipBtn(props: PropsWithChildren<ButtonProps & Pick<TooltipProps, "title">>) {
  const { title, children, ...btnProps } = props;
  return (
    <Tooltip title={title}>
      <Button {...btnProps}>{children}</Button>
    </Tooltip>
  );
}
