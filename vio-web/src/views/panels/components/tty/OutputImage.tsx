import { TtyOutputImageViewData } from "@/services/VioApi.ts";
import React, { useEffect, useMemo } from "react";
import { Image } from "antd";
import { useThemeToken } from "@/services/AppConfig.ts";
export type OutputProps = {
  data: TtyOutputImageViewData;
  date: string;
};
export function OutputImage(props: OutputProps) {
  const { data, date } = props;
  const colors = useThemeToken();
  const src = useMemo(() => {
    return URL.createObjectURL(data.data);
  }, [data]);
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(src);
    };
  }, [src]);

  return (
    <flex-row
      style={{
        justifyContent: "space-between",
        paddingTop: 4,
        borderTop: "1px solid",
        borderColor: colors.colorBorderSecondary,
      }}
    >
      <Image src={src} style={{ maxHeight: 200, objectFit: "contain" }} />
      <div>
        <div>{date}</div>
        <div></div>
      </div>
    </flex-row>
  );
}
