import React from "react";
import { JsData } from "@/components/JsObject.tsx";
export function Stack(props: { stack?: StackItem[]; onClick?(item: StackItem): void }) {
  const { onClick, stack } = props;
  return (
    <flex-col style={{ padding: "4px" }}>
      {stack?.map((item) => {
        return (
          <div>
            <JsData>{item}</JsData>
          </div>
        );
      })}
    </flex-col>
  );
}
export type StackItem = {
  title: string;
};
