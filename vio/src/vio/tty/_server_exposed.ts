import { CpCall, MakeCallers } from "cpcall";
import { ClientTtyExposed, TtyInputsReq, TtyOutputsData } from "./tty.dto.ts";
import { VioClientExposed } from "../api_type.ts";

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
  cancelTtyReadRequest(ttyId: number, requestId: number): void {
    if (!this.#api) throw new Error("Viewer has been disposed");
    CpCall.exec(this.#api.tty.cancelTtyReadRequest, ttyId, requestId);
  }
}
