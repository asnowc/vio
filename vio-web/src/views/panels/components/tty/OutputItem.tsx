import React, { useMemo } from "react";
import { MSG_TEXT_TYPE_OPTIONS, OutputText } from "./OutputText.tsx";
import { useThemeToken } from "@/services/AppConfig.ts";
import { TooltipBtn } from "@/views/components/TooltipBtn.tsx";
import { TtyOutputsViewData } from "@/services/VioApi.ts";
import { JsData } from "@/components/JsObject.tsx";
import { OutputImage } from "./OutputImage.tsx";
import { OutputTable } from "./OutputTable.tsx";
export function TtyOutput(props: { msg: TtyOutputsViewData; date: string }) {
  const { date } = props;
  const msg = props.msg;
  switch (msg.type) {
    case "log": {
      return <OutputText data={msg} date={date} />;
    }
    case "warn": {
      return <OutputText data={msg} date={date} />;
    }
    case "error": {
      return <OutputText data={msg} date={date} />;
    }
    case "info": {
      return <OutputText data={msg} date={date} />;
    }
    case "image": {
      return <OutputImage data={msg} date={date} />;
    }
    case "table": {
      return <OutputTable data={msg} date={date} />;
    }

    default: {
      const { type, ...rest } = msg;
      return <JsData>{[type, rest]}</JsData>;
    }
  }
}

export function TextMsgFilter(props: { filterValues: string[]; onFilerChange(values: string[]): void }) {
  const { filterValues, onFilerChange } = props;
  const tokens = useThemeToken();
  const selectedKeys = useMemo(() => new Set(filterValues), [filterValues]);
  return (
    <flex-row style={{ gap: 4 }}>
      {MSG_TEXT_TYPE_OPTIONS.map(({ icon, key, title }) => {
        const selected = !selectedKeys.has(key);
        return (
          <TooltipBtn
            key={key}
            title={title}
            icon={icon}
            size="small"
            style={{ color: selected ? undefined : tokens.colorTextDisabled }}
            onClick={
              selected
                ? () => onFilerChange([...filterValues, key])
                : () => onFilerChange(filterValues.filter((item) => item !== key))
            }
          />
        );
      })}
    </flex-row>
  );
}
