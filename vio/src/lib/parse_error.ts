export function genErrorInfo(err: any, opts?: { removeStack?: boolean }): ErrorJson {
  if (err instanceof Error) {
    const info: ErrorJson = {
      name: err.name,
      message: err.message,
    };
    if (!opts?.removeStack) info.stack = err.stack;
    if (err.cause !== undefined) info.cause = genErrorInfo(err.cause, opts);
    return info;
  }
  return {
    name: "[Throw a value]",
    message: String(err),
  };
}
export type ErrorJson = Error;
