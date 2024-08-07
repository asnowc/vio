import React, { useState } from "react";
import { DebugButtons } from "./btn.tsx";
import { useThemeToken } from "@/services/AppConfig.ts";
import { Stack, StackItem } from "./Stack.tsx";
import { StepStackClient } from "@/services/VioApi.ts";
import { useForceUpdate } from "@/hooks/forceUpdate.ts";
import { useListenable } from "@/hooks/event.ts";

export function DebugBoard(props: { instance: StepStackClient }) {
  const { instance } = props;
  const { colorBgBase, colorText, colorTextBase } = useThemeToken();
  const forceUpdate = useForceUpdate();
  useListenable(instance.onChange, forceUpdate);
  useListenable(instance.onStatusChange, forceUpdate);

  return (
    <div style={{ backgroundColor: colorBgBase, height: "100%", color: colorTextBase }}>
      <div style={{ width: "auto" }}>
        <DebugButtons
          paused={instance.paused}
          onClick={(command) => {
            instance.execCommand(command);
          }}
        />
      </div>
      <Stack stack={instance.eachStackList} />
    </div>
  );
}
function mockStackItem(): StackItem {
  return { title: "skdgjh" };
}
