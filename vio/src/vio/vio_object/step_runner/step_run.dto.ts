import type { DebugCommand } from "./_stack.ts";

export type StackChangeData<T = any> = {
  pop: number;
  push: T[];
};

export type ServerStepRunnerExposed = {
  execStepTaskCommand(objId: number, command: DebugCommand): void;
  getStepTaskCommand(objId: number): { list: any[]; paused: boolean };
};
export type ClientStepRunnerExposed = {
  stepTaskStatusChange(objId: number, pause: boolean): void;
  stepTaskStackChange(objId: number, change: StackChangeData): void;
};
