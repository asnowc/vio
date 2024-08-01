import { CpCall, MakeCallers } from "cpcall";
import { ClientTtyExposed, TtyInputsReq, TtyOutputsData, VioClientExposed } from "../vio/api_type.ts";

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
    if (!this.#api) return;
    CpCall.exec(this.#api.tty.ttyReadEnableChange, ttyId, enable);
  }
}
