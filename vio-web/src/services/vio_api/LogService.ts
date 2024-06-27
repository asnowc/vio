import { LinkedCacheQueue, LoopUniqueId } from "evlib/data_struct";
import { EventTrigger } from "evlib";

export class LogService {
  private logs = new LinkedCacheQueue<VioRpcLogInfo>(500);
  readonly logChange = new EventTrigger<void>();
  pushLog(type: VioRpcLogType, data: any, action?: string) {
    this.logs.push({ data, date: Date.now(), type, action, id: this.#msgId.next() });
    this.logChange.emit();
  }
  getLogs(): Generator<VioRpcLogInfo> {
    return this.logs[Symbol.iterator]();
  }
  clear() {
    this.logs.size = 0;
    this.logs.head = undefined;
    this.logs.last = undefined;
    this.#msgId.reset();
  }
  #msgId = new LoopUniqueId();
}

export type VioRpcLogInfo = {
  type: VioRpcLogType;
  action?: string;
  data: any;
  date: number;
  id: number;
};
export type VioRpcLogType = "message" | "notice" | "chart" | "tty";
