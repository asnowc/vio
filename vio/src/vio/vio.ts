import type { TtyInputsReq, TtyOutputsData } from "./api_type.ts";
import type { WebSocket } from "../lib/deno/http.ts";
import { ClientTtyApi, initWebsocket, type RpcClientApi } from "../rpc/mod.ts";
import { TTY, TtyCenter, VioTty } from "./tty/mod.ts";
import { VioObjectCenterImpl, VioObjectCenter } from "./vio_object/mod.private.ts";

/** VIO 实例。
 * @public
 */
export interface Vio extends TTY {
  /** 终端相关的接口 */
  readonly tty: TtyCenter;
  /**
   * 图相关的接口
   * @deprecated 改用 object
   */
  readonly chart: VioObjectCenter;
  /** 图相关的接口 */
  readonly object: VioObjectCenter;
  // joinViewer(viewer: VioClientExposed, onDispose?: (viewer: Viewer) => void): Viewer;
  /**
   * 接入一个终端连接
   * @remarks 每当一个web端连接时，都会调用这个方法
   */
  joinFormWebsocket(websocket: WebSocket, onDispose?: (viewer: Disposable) => void): Disposable;
  // getAllViewer(): IterableIterator<Viewer>;
  /** 与服务端保持连接的客户端数量 */
  viewerNumber: number;
}

class VioImpl extends TTY implements Vio {
  constructor() {
    super();
    const writeTty = (ttyId: number, data: TtyOutputsData) => {
      for (const viewer of this.#viewers.values()) viewer.tty.writeTty(ttyId, data);
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
  readonly #viewers = new Map<Viewer, RpcClientApi>();
  joinViewer(api: RpcClientApi, onDispose?: (viewer: Viewer) => void): Viewer {
    const viewer = new ViewerImpl(api.tty, (viewer) => {
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
  readonly object = new VioObjectCenterImpl({
    createObject: (...args) => {
      for (const viewer of this.#viewers.values()) viewer.object.createObject(...args);
    },
    deleteObject: (...args) => {
      for (const viewer of this.#viewers.values()) viewer.object.deleteObject(...args);
    },
    writeChart: (...args) => {
      for (const viewer of this.#viewers.values()) viewer.object.writeChart(...args);
    },
    tableChange: (...args) => {
      for (const viewer of this.#viewers.values()) viewer.object.tableChange(...args);
    },
    updateTable: (...args) => {
      for (const viewer of this.#viewers.values()) viewer.object.updateTable(...args);
    },
  });
  readonly chart: VioObjectCenter = this.object;
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
    ttyApi: ClientTtyApi,
    private onDispose: (viewer: ViewerImpl) => void,
  ) {
    this.#api = ttyApi;
  }
  readTty(ttyId: number, reqId: number, config: TtyInputsReq) {
    this.#api?.sendTtyReadRequest(ttyId, reqId, config);
  }
  writeTty(ttyId: number, data: TtyOutputsData): void {
    this.#api?.writeTty(ttyId, data);
  }
  #api?: ClientTtyApi;

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
