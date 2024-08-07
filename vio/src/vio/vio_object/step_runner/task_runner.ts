import { EventTrigger } from "evlib";
import { DebugCommand, DebugState, Stack } from "./_stack.ts";
import { StepTask, StepGroup } from "./step_group.ts";
import { StackChangeData } from "./step_run.dto.ts";
import { VioObject } from "../_object_base.type.ts";

export class TaskDebuggerRunner<I> {
  private stack = new Stack<I>((data) => {
    this.paused = true;
    this.stackChangeEvent.emit(data);
  });
  get stackTop() {
    return this.stack.stackTop;
  }
  get stackLength() {
    return this.stack.stackLength;
  }
  *eachStack() {
    return this.stack.eachStack();
  }
  getStackList() {
    return Array.from(this.stack.eachStack());
  }

  #lock = false;
  /** 处理任务的执行 */
  async run<O>(generator: StepTask<O>, stepInfo?: any): Promise<O> {
    if (this.#lock) throw new Error("TaskRunner is locked");
    this.#lock = true;
    return this.processTask(generator, stepInfo).finally(() => {
      this.stackChangeEvent.close();
      this.pausedEvent.close();
    });
  }
  private async processTask(generator: StepTask<any>, stepInfo?: any): Promise<any> {
    this.stack.push(stepInfo);
    try {
      return await this.process(generator);
    } finally {
      this.#lock = false;
      this.stack.pop();
    }
  }
  private async process<O>(generator: StepTask<O>): Promise<O> {
    this.paused = false;
    let res = await generator.next();
    let param: any;
    while (!res.done) {
      if (this.aborted) await generator.throw(this.aborted);
      let stepInfo = res.value;

      if (stepInfo instanceof StepGroup) {
        this.stack.replace(stepInfo.data);
        if (this.breakPoints.isBreakPoint()) await this.breakPoints.waitContinue();
        try {
          param = await this.processTask(stepInfo.generator, stepInfo.data);
        } catch (error) {
          await generator.throw(error);
        }
      } else {
        this.stack.replace(stepInfo);
      }
      if (this.breakPoints.isBreakPoint()) await this.breakPoints.waitContinue();

      this.paused = false;
      res = await generator.next(param);
    }

    return res.value;
  }
  private aborted?: Error;
  abort(error: Error): void;
  abort(error: unknown) {
    if (this.aborted) return;
    if (error instanceof Error) this.aborted = error;
    else this.aborted = new Error(String(error));
  }

  paused = true;
  /** 当堆栈数据发生变化时触发, 频率限制为33毫秒 */
  readonly stackChangeEvent = new EventTrigger<StackChangeData>();
  /** 当步骤命中断点暂停时触发 */
  readonly pausedEvent = new EventTrigger<boolean>();
  private breakPoints = new DebugState(this.stack, () => this.pausedEvent.emit(true));
  /** 添加断点函数 */
  addBreakPoint(fn: (deep: number, data: any) => boolean) {
    return this.breakPoints.addBreakPoint(fn);
  }
  /** 发送继续指令 */
  continue() {
    return this.breakPoints.continue();
  }
  /** 发送暂停指令 */
  pause(): void {
    return this.breakPoints.pause();
  }
  /** 发送步过指令 */
  next(): void {
    return this.breakPoints.next();
  }
  /** 发送步入指令 */
  nextIn(): void {
    return this.breakPoints.nextIn();
  }
  /** 发送步出指令 */
  nextOut(): void {
    return this.breakPoints.nextOut();
  }
  execCommand(cmd: DebugCommand) {
    switch (cmd) {
      case DebugCommand.continue:
        this.continue();
        break;
      case DebugCommand.pause:
        this.pause();
        break;
      case DebugCommand.next:
        this.next();
        break;
      case DebugCommand.nextIn:
        this.nextIn();
        break;
      case DebugCommand.nextOut:
        this.nextOut();
        break;
      default:
        throw new Error("Unrecognized command '" + String(cmd) + "'");
    }
  }
}
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
  getStack() {
    return this.runner.getStackList();
  }
  get paused() {
    return this.runner.paused;
  }
}

export { DebugCommand };
