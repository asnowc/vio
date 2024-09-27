import React, { useMemo, ReactNode, useRef, CSSProperties, useEffect } from "react";
import {
  Orientation,
  SplitviewPanel,
  IFrameworkPart,
  SplitviewComponent,
  AddSplitviewComponentOptions,
} from "dockview";
import { createPortal } from "react-dom";

export function useSplitLayout(direction: "horizontal" | "vertical", props: UseSplitLayoutProps = {}) {
  const { hideBorder } = props;
  const res = useMemo(() => {
    const dom = document.createElement("div");
    dom.style.height = "100%";
    const api = new SplitviewComponent(dom, {
      orientation: direction === "horizontal" ? Orientation.HORIZONTAL : Orientation.VERTICAL,
      components: { default: SplitLayoutPanel },
      styles: hideBorder ? { separatorBorder: "transparent" } : undefined,
    });

    api.layout(10, 10); //这个不影响随便设置一个
    const setIntoDom = (container: HTMLDivElement | null) => {
      if (dom.parentNode) dom.parentNode.removeChild(dom);
      if (container) {
        container.appendChild(dom);
      }
    };
    const appPanel = (id: string, opts?: AddSplitPanelOption) => {
      return api.addPanel({ ...opts, id, component: "default" });
    };
    return { dom, api, setIntoDom, appPanel };
  }, [direction]);
  useEffect(() => () => res.api.dispose(), [res.api]);

  return res;
}

type UseSplitLayoutProps = {
  hideBorder?: boolean;
};
type AddSplitPanelOption = Pick<
  AddSplitviewComponentOptions,
  "maximumSize" | "minimumSize" | "size" | "index" | "params"
>;
export type SplitPanelConfig = Pick<AddSplitPanelOption, "maximumSize" | "minimumSize" | "size"> & {
  children: ReactNode;
  id: string;
};
export type SplitLayoutProps = UseSplitLayoutProps & {
  panels?: SplitPanelConfig[];
  direction: "horizontal" | "vertical";
  style?: CSSProperties;
  className?: string;
};

export function SplitLayout(props: SplitLayoutProps) {
  const { direction, style, panels: panelList, className } = props;
  const { api, setIntoDom, appPanel, dom } = useSplitLayout(direction, props);

  const beforeRef = useRef<Map<SplitviewPanel, number>>();

  const portals = useMemo(() => {
    const views = panelList ?? [];
    const size = views.length;

    const newPortals = new Array(size);
    const beforePanelMap: Map<SplitviewPanel, number> = beforeRef.current ?? new Map();
    const currentPanelMap = new Map<SplitviewPanel, number>();
    beforeRef.current = currentPanelMap;

    let insertOffset = 0;
    const moveOffsetStack: number[] = [];
    //Diff 算法。 时间复杂度 O(1).，
    for (let i = 0; i < views.length; i++) {
      const view = views[i];
      let panel: SplitviewPanel | undefined = api.getPanel(view.id);
      if (panel) {
        let form = beforePanelMap.get(panel)! + insertOffset;
        const moveOffset = moveOffsetStack.length;
        if (moveOffset > 0) {
          const stackTop = moveOffsetStack[moveOffset - 1];
          if (i <= stackTop) form += moveOffset;
          if (i === stackTop) moveOffsetStack.pop();
        }

        if (i !== form) {
          api.splitview.moveView(form, i); //移动
          moveOffsetStack.push(form);
        }
        beforePanelMap.delete(panel);
      } else {
        panel = appPanel(view.id, { ...view, index: i });
        insertOffset++;
        //增加
      }
      currentPanelMap.set(panel, i);
      newPortals[i] = createPortal(views[i].children, panel.element, view.id);
    }
    for (const panel of beforePanelMap.keys()) {
      api.removePanel(panel);
    }

    return newPortals;
  }, [panelList]);

  return (
    <div className={className} style={{ height: "100%", ...style }} ref={setIntoDom}>
      {portals}
    </div>
  );
}
type DoubleSplitLayoutPanelsConfig = {
  maximumSize?: number;
  minimumSize?: number;
  defaultSize?: number;
};
export type DoubleSplitLayoutProps = UseSplitLayoutProps & {
  panels?: DoubleSplitLayoutPanelsConfig[];
  children: [ReactNode, ReactNode];
  direction: "horizontal" | "vertical";
  style?: CSSProperties;
  className?: string;
};
export function DoubleSplitLayout(props: DoubleSplitLayoutProps) {
  const { children, direction, style, panels: panelsConfig, className } = props;
  const { api, setIntoDom, appPanel } = useSplitLayout(direction, props);
  function create(id: string, element?: ReactNode, panel?: SplitviewPanel, opts: DoubleSplitLayoutPanelsConfig = {}) {
    if (element) {
      if (!panel) {
        panel = appPanel(id, { maximumSize: opts.maximumSize, minimumSize: opts.minimumSize, size: opts.defaultSize });
      }
      return createPortal(element, panel.element);
    } else {
      if (panel) {
        api.removePanel(panel);
        panel.dispose();
      }
    }
  }

  const { left, right } = useMemo(() => {
    if (!children) return {};
    const panels = api.panels;

    const left = create("left", children[0], panels[0], panelsConfig?.[0]);
    const right = create("right", children[1], panels[1], panelsConfig?.[1]);
    return { left, right };
  }, [children, panelsConfig]);
  return (
    <div className={className} style={{ height: "100%", ...style }} ref={setIntoDom}>
      {left}
      {right}
    </div>
  );
}

class SplitLayoutPanel extends SplitviewPanel {
  protected getComponent(): IFrameworkPart {
    return NULL_PART;
  }
}
const NULL_PART: IFrameworkPart = {
  dispose() {},
  update(params) {},
};
