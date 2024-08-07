/** @public */
export class StepGroup<O> implements StepTask<O> {
  constructor(generator: StepTask<O>, data?: any);
  constructor(
    public generator: StepTask<O>,
    readonly data: any,
  ) {}

  next(value: any): Promise<IteratorResult<any, O>> {
    return this.generator.next(value);
  }
  return(value: O): Promise<IteratorResult<any, O>> {
    return this.generator.return(value);
  }
  throw(error: any): Promise<IteratorResult<any, O>> {
    return this.generator.throw(error);
  }
  [Symbol.asyncIterator](): AsyncGenerator<any, O, void> {
    return this.generator[Symbol.asyncIterator]();
  }
}
/** @public */
export type StepTaskFn<Args extends any[] = [], R = any> = (...args: Args) => StepTask<R>;

/** @public */
export type StepTask<R> = AsyncGenerator<any, R, any>;

/** @public */
export interface RunStepTaskOption {
  data?: any;
  /** 默认暂停执行 */
  pause?: boolean;
}

/**
 * 获取步骤生成器结果值
 * @public
 */
export type GetStepRes<T> = T extends StepTask<infer P> ? P : never;
interface DebugControl {
  next(): void;
  pause(): void;
  continue(): void;
  next(): void;
  nextIn(): void;
  nextOut(): void;
}
