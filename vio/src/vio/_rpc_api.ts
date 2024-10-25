import { CpCall, createWebSocketCpc } from "cpcall";
import type { VioClientExposed, VioServerExposed } from "./api_type.ts";
import type { WebSocket } from "../lib/deno/http.ts";
import { ClientObjectApi } from "./vio_object/mod.private.ts";
import { ClientTtyApi } from "./tty/mod.private.ts";

export class CpcViewer implements Viewer {
  constructor(
    websocket: WebSocket,
    private onDispose: (viewer: Viewer) => void,
  ) {
    const cpc = createWebSocketCpc(websocket);
    this.#cpc = cpc;
    this.#cpc.onClose
      .catch(() => {})
      .finally(() => {
        this.dispose();
        this.onDispose(this);
      });
    const caller = cpc.genCaller<VioClientExposed>();

    this.object = new ClientObjectApi(caller);
    this.tty = new ClientTtyApi(caller);
  }
  exposeApi(serviceExposed: VioServerExposed) {
    this.#cpc.exposeObject(serviceExposed);
  }
  #cpc: CpCall;
  readonly object: ClientObjectApi;
  readonly tty: ClientTtyApi;

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#cpc.dispose();
    // this.#cpc.endServe();
    // this.#cpc.endCall();
  }
  #disposed = false;
  get disposed() {
    return this.#disposed;
  }
}

export interface Viewer extends VioClientExposed {
  disposed: boolean;
  dispose(): void;
}
