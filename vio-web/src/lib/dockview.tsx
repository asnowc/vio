import { usePortalsLifecycle } from "./dockview/portals_lifecycle.ts";
import { DockviewApi, DockviewComponent, DockviewFrameworkOptions } from "dockview";
import React, { ComponentProps, useRef, useEffect } from "react";
export * from "./dockview/SplitLayout.tsx";
// export type DockviewProps = ComponentProps<typeof DockviewReact>;
export type DockviewProps = ComponentProps<any>;
export function Dockview(props: DockviewProps) {
  const [portals, addPortal] = usePortalsLifecycle();

  // return React.createElement(DockviewReact, props);
  const domRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dom = domRef.current!;

    const frameworkOptions: DockviewFrameworkOptions = {
      createComponent: ({ id, name }) => {
        const element = document.createElement("div");

        return {
          element,
          init(parameters) {
            const portal = addPortal(<div>hhh</div>, element);
          },
          update(event) {
            event.params;
          },
          dispose() {},
        };
      },
      parentElement: dom,
    };
    const component = new DockviewComponent(frameworkOptions);

    props.onReady({ api: new DockviewApi(component) });
  }, []);
  return (
    <div className={props.className ?? "dockview-theme-dark"} ref={domRef} style={{ height: "100%" }}>
      {portals}
    </div>
  );
}
