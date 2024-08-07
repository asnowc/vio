import { withPromise } from "evlib";
import { StackChangeData } from "./step_run.dto.ts";

type StepStack<T> = {
  before?: StepStack<T>;
  data: T;
};
export class Stack<T> {
  constructor(onChange: (data: StackChangeData<T>) => void) {
    this.#changeMerge = new ChangeMerge(onChange);
  }

  private stack?: StepStack<T>;
  get stackTop() {
    return this.stack?.data;
  }
  #stackLen = 0;
  get stackLength() {
    return this.#stackLen;
  }
  *eachStack() {
    let item = this.stack;
    while (item) {
      yield item.data;
      item = item.before;
    }
  }
  replace(data: any) {
    this.stack!.data = data;
    this.#changeMerge.replace(data);
  }
  pop() {
    let item = this.stack!;
    this.stack = item.before;
    this.#stackLen--;
    this.#changeMerge.pop();

    return item.data;
  }
  push(info: any) {
    this.stack = { data: info, before: this.stack };
    this.#stackLen++;
    this.#changeMerge.push(info);
  }
  #changeMerge;
}

class ChangeMerge {
  constructor(private onChange: (data: StackChangeData) => void) {}
  replace(data: any) {
    const pushed = this.#changed.push;
    if (pushed.length) {
      pushed[pushed.length - 1] = data;
    } else {
      pushed.push(data);
    }
    this.#setTimeout();
  }
  pop() {
    const pushed = this.#changed.push;
    if (pushed.length) pushed.pop();
    else this.#changed.pop++;
    this.#setTimeout();
  }
  push(data: any) {
    this.#setTimeout();
    return this.#changed.push.push(data);
  }

  #timer?: number;
  #setTimeout() {
    if (this.#timer !== undefined) return;
    this.#timer = setTimeout(this.#triggerChange, 33) as any;
  }
  #changed = { pop: 0, push: [] as any[] };
  #triggerChange = () => {
    const data = this.#changed;
    if (data.pop === 0 && data.push.length === 0) return;
    this.#changed = { pop: 0, push: [] };
    this.#timer = undefined;
    this.onChange(data);
  };
}
export class DebugState {
  constructor(
    readonly stack: Stack<any>,
    private onPause: () => void,
  ) {}
  private breakPoints = new Set<(deep: number, data: any) => boolean>();
  private status?: DebugCommand;
  private nextIndex = -1;

  isBreakPoint() {
    if (this.status === DebugCommand.pause || this.status === DebugCommand.nextIn) return true;
    else if (
      this.nextIndex === this.stackLength &&
      (this.status === DebugCommand.next || this.status === DebugCommand.nextOut)
    ) {
      return true;
    }

    for (const check of this.breakPoints) {
      if (check(this.stackLength, this.stackTop)) return true;
    }
    return false;
  }
  waitContinue() {
    Promise.resolve().then(this.onPause);
    if (this.#hd) {
      return this.#hd.promise;
    }
  }

  private get stackTop() {
    return this.stack.stackTop;
  }
  private get stackLength() {
    return this.stack.stackLength;
  }
  #hd?: { promise: Promise<void>; resolve(): void; reject(): void };

  addBreakPoint(fn: (deep: number, data: any) => boolean) {
    this.breakPoints.add(fn);
  }
  pause() {
    this.status = DebugCommand.pause;
    if (this.#hd) return;
    this.#hd = withPromise();
  }
  continue() {
    if (!this.#hd) return;
    this.#hd.resolve();
    this.status = undefined;
    this.#hd = undefined;
  }
  next(): void {
    this.status = DebugCommand.next;
    this.nextIndex = this.stackLength;
    this.#hd?.resolve();
    this.#hd = withPromise();
  }
  nextIn(): void {
    this.status = DebugCommand.nextIn;

    this.#hd?.resolve();
    this.#hd = withPromise();
  }
  nextOut(): void {
    this.status = DebugCommand.nextOut;

    this.nextIndex = this.stackLength - 1;

    this.#hd?.resolve();
    this.#hd = withPromise();
  }
}
export enum DebugCommand {
  /** 继续 */
  continue = "continue",
  /** 暂停 */
  pause = "pause",
  /** 步过 */
  next = "next",
  /** 步入 */
  nextIn = "nextIn",
  /** 步出 */
  nextOut = "nextOut",
}
