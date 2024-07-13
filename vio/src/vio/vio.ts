import type { VioClientExposed, TtyInputsReq, TtyOutputsData } from "./api_type.ts";
import type { WebSocket } from "../lib/deno/http.ts";
import { initWebsocket } from "../rpc/rpc_api.ts";
import { TtyCenter, ChartCenter, TTY, VioTty } from "./classes/mod.ts";

/** VIO 实例。
 * @public
 */
export interface Vio extends TTY {
  readonly tty: TtyCenter;
  /** 图相关的接口 */
  readonly chart: ChartCenter;
  // joinViewer(viewer: VioClientExposed, onDispose?: (viewer: Viewer) => void): Viewer;
  joinFormWebsocket(websocket: WebSocket, onDispose?: (viewer: Disposable) => void): Disposable;
  // getAllViewer(): IterableIterator<Viewer>;
  viewerNumber: number;
}

class VioImpl extends TTY implements Vio {
  constructor() {
    super();
    const writeTty = (ttyId: number, data: TtyOutputsData) => {
      for (const viewer of this.#viewers.values()) viewer.writeTty(ttyId, data);
    };
    this.tty = new TtyCenter(writeTty);
    this.#tty0 = this.tty.get(0);
  }
  #tty0: VioTty;
  read<T = unknown>(config: TtyInputsReq): Promise<T> {
    return this.#tty0.read(config);
  }
  write(data: TtyOutputsData): void {
    return this.#tty0.write(data);
  }
  readonly #viewers = new Map<Viewer, VioClientExposed>();
  joinViewer(api: VioClientExposed, onDispose?: (viewer: Viewer) => void): Viewer {
    const viewer = new ViewerImpl(api, (viewer) => {
      this.#viewers.delete(viewer);
      onDispose?.(viewer);
    });
    this.#viewers.set(viewer, api);
    return viewer;
  }
  get viewerNumber() {
    return this.#viewers.size;
  }
  getAllViewer(): IterableIterator<Viewer> {
    return this.#viewers.keys();
  }
  joinFormWebsocket(websocket: WebSocket, onDispose?: (viewer: Disposable) => void): Disposable {
    const { clientApi, cpc } = initWebsocket(this, websocket);

    const viewer = this.joinViewer(clientApi, (viewer) => {
      cpc.dispose();
      onDispose?.(viewer);
    });
    cpc.onClose
      .finally(() => {
        if (!viewer.disposed) viewer.dispose();
      })
      .catch(() => {});
    return viewer;
  }

  readonly tty: TtyCenter;
  readonly chart: ChartCenter = new ChartCenter({
    writeChart: (chartId, data) => {
      for (const viewer of this.#viewers.values()) viewer.writeChart(chartId, data);
    },
    createChart: (config) => {
      for (const viewer of this.#viewers.values()) viewer.createChart(config);
    },
    deleteChart: (chartId) => {
      for (const viewer of this.#viewers.values()) viewer.deleteChart(chartId);
    },
  });
}
/**
 * 创建 Vio 实例
 * @public
 */
// @__NO_SIDE_EFFECTS__
export function createVio(): Vio {
  return new VioImpl();
}

class ViewerImpl implements Viewer {
  constructor(
    api: VioClientExposed,
    private onDispose: (viewer: ViewerImpl) => void,
  ) {
    this.#api = api;
  }
  readTty(ttyId: number, reqId: number, config: TtyInputsReq) {
    this.#api?.sendTtyReadRequest(ttyId, reqId, config);
  }
  writeTty(ttyId: number, data: TtyOutputsData): void {
    this.#api?.writeTty(ttyId, data);
  }
  #api?: VioClientExposed;

  dispose(): void {
    if (!this.#api) return;
    this.#api = undefined;
    this.onDispose(this);
  }
  get disposed() {
    return !this.#api;
  }
}
/** @public */
export interface Disposable {
  dispose(): void;
}
interface Viewer {
  disposed: boolean;
  dispose(): void;
  readTty(ttyId: number, reqId: number, config: TtyInputsReq): void;
  writeTty(ttyId: number, data: TtyOutputsData): void;
}

/** @public */
export type ClassToInterface<T extends object> = {
  [key in keyof T]: T[key];
};
