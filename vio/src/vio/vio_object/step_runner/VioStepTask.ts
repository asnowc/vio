import { VioObject } from "../_object_base.type.ts";
import { DebugCommand, TaskDebuggerRunner } from "./task_runner.ts";

export class VioStepTask implements VioObject {
  constructor(
    readonly id: number,
    private runner: TaskDebuggerRunner<any>,
    readonly name?: string,
  ) {}
  readonly type = "stepTask";
  execCommand(cmd: DebugCommand) {
    this.runner.execCommand(cmd);
  }
}
