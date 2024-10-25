import type { TtyInputsReq, TtyOutputsData, VioClientExposed, VioServerExposed } from "./api_type.ts";
import type { WebSocket } from "../lib/deno/http.ts";
import { CpcViewer, Viewer } from "./_rpc_api.ts";
import { TTY, TtyCenter, VioTty, TtyCenterImpl, ServerTtyExposedImpl } from "./tty/mod.private.ts";
import { VioObjectCenterImpl, VioObjectCenter } from "./vio_object/mod.private.ts";

/** VIO 实例。
 * @public
 */
export interface Vio extends TTY {
  /** 终端相关的接口 */
  readonly tty: TtyCenter;
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

  readonly #viewers = new Set<Viewer>();

  get viewerNumber() {
    return this.#viewers.size;
  }
  getAllViewer(): IterableIterator<Viewer> {
    return this.#viewers.keys();
  }
  joinFormWebsocket(websocket: WebSocket, onDispose?: (viewer: Disposable) => void): Disposable {
    const viewer = new CpcViewer(websocket, (viewer) => {
      this.#viewers.delete(viewer);
      onDispose?.(viewer);
    });
    const serviceExposed: VioServerExposed = {
      object: this.object,
      tty: new ServerTtyExposedImpl(this.tty, viewer, this.#viewers),
    };
    viewer.exposeApi(serviceExposed);
    this.#viewers.add(viewer);
    setTimeout(() => {
      for (const cachedRead of this.tty.eachWaitingReadRequest()) {
        viewer.tty.sendTtyReadRequest(cachedRead.ttyId, cachedRead.requestId, cachedRead.config);
      }
    });
    return viewer;
  }

  readonly tty = new TtyCenterImpl({
    sendTtyReadRequest: (...args) => {
      for (const viewer of this.#viewers.values()) viewer.tty.sendTtyReadRequest(...args);
    },
    cancelTtyReadRequest: (...args) => {
      for (const viewer of this.#viewers.values()) {
        viewer.tty.cancelTtyReadRequest(...args);
      }
    },
    writeTty: (...args) => {
      for (const viewer of this.#viewers.values()) viewer.tty.writeTty(...args);
    },
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
