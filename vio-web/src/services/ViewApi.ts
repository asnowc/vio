import { createContext, useContext } from "react";
import { DockviewApi, IDockviewPanel } from "dockview";
import { panels } from "../views/panels/mod.ts";
import { EventTrigger, ParameterTypeError } from "evlib";

export class ViewApi {
  constructor(viewApi: DockviewApi) {
    this.#viewApi = viewApi;
    this._init();
  }
  #viewApi: DockviewApi;
  private _init() {
    this.#viewApi.onDidRemovePanel((e) => {
      const panelId = e.id;

      const ttyId = parseTtyId(panelId);
      if (ttyId !== null) {
        this.openedTtyIds = this.openedTtyIds.filter((id) => id !== ttyId);
        this.openedTtyIdsChange.emit();
      } else if (panelId.startsWith(OBJECT_PANEL_ID_PREFIX)) {
        this.#openedObjPanel.delete(panelId);
      }
    });
    this.#viewApi.onDidLayoutFromJSON(() => {
      this.#openedObjPanel.clear();
      let openedTtyIds: number[] = [];
      //布局变化，重新计算状态
      for (const panel of this.#viewApi.panels) {
        const id = panel.id;
        const ttyId = parseTtyId(id);
        if (ttyId !== null) openedTtyIds.push(ttyId);
        else if (id.startsWith(OBJECT_PANEL_ID_PREFIX)) this.#openedObjPanel.set(id, panel);
      }
      this.openedTtyIds = openedTtyIds;
      this.openedTtyIdsChange.emit();
    });
    if (!this.restoreLayout()) this.openTtyPanel(0);
  }
  saveLayout() {
    saveLayoutToLocalStorage(this.#viewApi.toJSON());
  }
  restoreLayout() {
    const data = getLayoutFromLocalStorage();
    if (!data) return false;
    try {
      this.#viewApi.fromJSON(data);
    } catch (error) {
      console.error("布局恢复出错", error);
    }
    return true;
  }
  /* Bar */
  readonly functionOpenedChange = new EventTrigger<string | undefined>();
  functionOpened?: string;
  openFunctionBar(key?: string) {
    this.functionOpened = key;
    this.functionOpenedChange.emit(key);
  }

  /* TTY */

  openedTtyIds: number[] = [];
  readonly openedTtyIdsChange = new EventTrigger<void>();
  openTtyPanel(index: number) {
    if (typeof index !== "number") throw new ParameterTypeError(0, "number", typeof index, "index");
    if (this.openedTtyIds.includes(index)) return;
    const firstPanelIndex = this.openedTtyIds[0];
    this.#viewApi.addPanel({
      id: genTtyPanelId(index),
      component: panels.VioTty,
      title: "TTY " + index,
      params: { index, TabIcon: "CodeOutlined" },
      position: firstPanelIndex ? { referencePanel: genTtyPanelId(firstPanelIndex) } : undefined,
    });
    this.openedTtyIds.push(index);
    this.openedTtyIdsChange.emit();
  }
  getOpenedTtyPanel(ttyId: number) {
    return this.#viewApi.getPanel(genTtyPanelId(ttyId));
  }

  /* Chart */

  #openedObjPanel = new Map<string, IDockviewPanel>();
  getOpenedChartPanel(chartId: number) {
    return this.#openedObjPanel.get(OBJECT_PANEL_ID_PREFIX + chartId);
  }
  openChartPanel(chartId: number, title = chartId.toString()) {
    if (typeof chartId !== "number") throw new ParameterTypeError(0, "number", typeof chartId, "index");
    const chartPanelId = OBJECT_PANEL_ID_PREFIX + chartId;
    let panel = this.#viewApi.getPanel(chartPanelId);
    if (panel) return panel.focus();

    const firstPanel: IDockviewPanel | undefined = this.#openedObjPanel.values().next().value;

    panel = this.#viewApi.addPanel({
      id: chartPanelId,
      component: panels.VioChart,
      title,
      params: { chartId, TabIcon: "DashboardOutlined" },
      position: firstPanel ? { referencePanel: firstPanel } : undefined,
    });
    this.#openedObjPanel.set(chartPanelId, panel);
  }

  getOpenedTablePanel(tableId: number) {
    return this.#openedObjPanel.get(OBJECT_PANEL_ID_PREFIX + tableId);
  }
  openTablePanel(tableId: number, title = tableId.toString()) {
    if (typeof tableId !== "number") throw new ParameterTypeError(0, "number", typeof tableId, "index");
    const chartPanelId = OBJECT_PANEL_ID_PREFIX + tableId;
    let panel = this.#viewApi.getPanel(chartPanelId);
    if (panel) return panel.focus();

    const firstPanel: IDockviewPanel | undefined = this.#openedObjPanel.values().next().value;

    panel = this.#viewApi.addPanel({
      id: chartPanelId,
      component: panels.VioTable,
      title,
      params: { objectId: tableId, TabIcon: "TableOutlined" },
      position: firstPanel ? { referencePanel: firstPanel } : undefined,
    });
    this.#openedObjPanel.set(chartPanelId, panel);
  }
  /* StepTask */

  getOpenedStepTaskPanel(stepTaskId: number) {
    return this.#openedObjPanel.get(OBJECT_PANEL_ID_PREFIX + stepTaskId);
  }
  openStepTaskPanel(stepTaskId: number, title = stepTaskId.toString()) {
    if (typeof stepTaskId !== "number") throw new ParameterTypeError(0, "number", typeof stepTaskId, "index");
    const chartPanelId = OBJECT_PANEL_ID_PREFIX + stepTaskId;
    let panel = this.#viewApi.getPanel(chartPanelId);
    if (panel) return panel.focus();

    const firstPanel: IDockviewPanel | undefined = this.#openedObjPanel.values().next().value;

    panel = this.#viewApi.addPanel({
      id: chartPanelId,
      component: panels.VioStepTask,
      title,
      params: { objectId: stepTaskId, TabIcon: "BugOutlined" },
      position: firstPanel ? { referencePanel: firstPanel } : undefined,
    });
    this.#openedObjPanel.set(chartPanelId, panel);
  }
}

//@ts-ignore
const DockViewCtx = createContext<ViewApi>();

export const DockViewApiProvider = DockViewCtx.Provider;
/** 获取封装的视图相关的api */
export function useViewApi() {
  return useContext(DockViewCtx);
}

function getLayoutFromLocalStorage() {
  const layoutStr = localStorage.getItem("vio-dockview-layout");
  if (!layoutStr) return;
  let layout: LayoutInfo;
  try {
    layout = JSON.parse(layoutStr);
  } catch (error) {
    return;
  }
  return layout.data as any;
}
function saveLayoutToLocalStorage(data: object) {
  const str = JSON.stringify({ version: 1, data });
  localStorage.setItem("vio-dockview-layout", str);
}
type LayoutInfo = {
  version: number;
  data: object;
};
const OBJECT_PANEL_ID_PREFIX = "object-";
const TTY_PANEL_ID_PREFIX = "tty-";
function genTtyPanelId(index: number) {
  return TTY_PANEL_ID_PREFIX + index;
}
function parseTtyId(id: string) {
  if (id.startsWith(TTY_PANEL_ID_PREFIX)) {
    const index = parseInt(id.slice(TTY_PANEL_ID_PREFIX.length));
    if (index >= 0) return index;
  }
  return null;
}
