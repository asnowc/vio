import { useThemeToken } from "@/services/AppConfig.ts";
import React from "react";
import { CSSProperties, PropsWithChildren, ReactNode } from "react";
export function ListItem(props: ListItemProps) {
  const { title, children, icon, extra, style, contentIndent = true } = props;
  const colors = useThemeToken();
  return (
    <div style={{ padding: "4px 8px", borderRadius: 4, backgroundColor: colors.colorFillQuaternary, ...style }}>
      <flex-row
        style={{
          justifyContent: "space-between",
        }}
      >
        <flex-row style={{ gap: 6 }}>
          {icon}
          {title}
        </flex-row>
        <div style={{ color: colors.colorTextSecondary, fontFamily: colors.fontFamily }}>{extra}</div>
      </flex-row>
      {children && (
        <div style={{ padding: contentIndent ? "4px 0 0 18px" : "4px 0 0 0", fontFamily: colors.fontFamily }}>
          {children}
        </div>
      )}
    </div>
  );
}

export type ListItemProps = PropsWithChildren<{
  icon?: ReactNode;
  title?: ReactNode;
  extra?: ReactNode;
  style?: CSSProperties;
  contentIndent?: boolean;
}>;
