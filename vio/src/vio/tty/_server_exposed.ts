import { CpCall, MakeCallers } from "cpcall";
import { ClientTtyExposed, ServerTtyExposed, TtyInputsReq, TtyOutputsData } from "./tty.dto.ts";
import { TtyCenter, TtyReadResolver } from "./TtyCenter.ts";
import { VioClientExposed } from "../api_type.ts";

export class RpcServerTtyExposed implements ServerTtyExposed {
  constructor(ttyCenter: TtyCenter, clientApi: ClientTtyExposed) {
    this.#tty = ttyCenter;
    this.#clientApi = clientApi;
  }
  #clientApi: ClientTtyExposed;
  #tty: TtyCenter;
  getTtyCache(id: number): TtyOutputsData[] {
    const tty = this.#tty.getCreated(id);
    if (!tty) return [];
    return Array.from(tty.getCache());
  }
  resolveTtyReadRequest(ttyId: number, requestId: number, res: any): boolean {
    const hd = this.#resolverMap[ttyId];
    if (!hd) return false;
    return hd.resolve(requestId, res);
  }
  rejectTtyReadRequest(ttyId: number, requestId: number, reason: any): boolean {
    const hd = this.#resolverMap[ttyId];
    if (!hd) return false;
    return hd.reject(requestId, reason);
  }
  inputTty(ttyId: number, data: any): boolean {
    const resolver = this.#resolverMap[ttyId];
    if (!resolver) return false;
    return resolver.input(data);
  }
  /** 某个连接中开启读取权的 tty 字典 */
  #resolverMap: Record<number, TtyReadResolver> = {};
  setTtyReadEnable(ttyId: number, enable: boolean): boolean {
    let resolver = this.#resolverMap[ttyId];
    if (enable) {
      if (resolver) return true;
      else {
        resolver = this.#tty.setReader(ttyId, {
          read: (ttyId: number, requestId: number, data: TtyInputsReq) =>
            this.#clientApi.sendTtyReadRequest(ttyId, requestId, data),
          dispose: () => {
            if (this.#resolverMap[ttyId]) {
              delete this.#resolverMap[ttyId];
              this.#clientApi.ttyReadEnableChange(ttyId, false);
            }
          },
        });
      }
      this.#resolverMap[ttyId] = resolver;
    } else {
      if (resolver) {
        delete this.#resolverMap[ttyId]; // 主动关闭，dispose 之前删除,
        resolver.dispose();
      }
    }
    return true;
  }
}
export class ClientTtyApi implements ClientTtyExposed {
  constructor(api: MakeCallers<VioClientExposed>) {
    this.#api = api;
  }
  #api?: MakeCallers<VioClientExposed>;
  sendTtyReadRequest(ttyId: number, requestId: number, data: TtyInputsReq) {
    if (!this.#api) return Promise.reject(new Error("Viewer has been disposed"));
    CpCall.exec(this.#api.tty.sendTtyReadRequest, ttyId, requestId, data);
  }
  writeTty(id: number, data: TtyOutputsData | TtyOutputsData): void {
    if (!this.#api) throw new Error("Viewer has been disposed");
    CpCall.exec(this.#api.tty.writeTty, id, data);
  }
  ttyReadEnableChange(ttyId: number, enable: boolean): void {
    if (!this.#api) throw new Error("Viewer has been disposed");
    CpCall.exec(this.#api.tty.ttyReadEnableChange, ttyId, enable);
  }
}
