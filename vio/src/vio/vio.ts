import type { TtyInputsReq, TtyOutputsData } from "./api_type.ts";
import type { WebSocket } from "../lib/deno/http.ts";
import { initWebsocket, type RpcClientApi, Viewer, ViewerImpl } from "./_rpc_api.ts";
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
  }
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

  readonly tty: TtyCenter = new TtyCenter((...args) => {
    for (const viewer of this.#viewers.values()) viewer.tty.writeTty(...args);
  });
  #tty0: VioTty = this.tty.get(0);
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
  /**
   * 图相关的接口
   * @deprecated 改用 object
   */
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

/** @public */
export interface Disposable {
  dispose(): void;
}
