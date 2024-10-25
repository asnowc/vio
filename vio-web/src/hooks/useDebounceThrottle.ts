import { useCallback, useRef } from "react";

export function useDebounceThrottle<T extends (...args: any[]) => any>(fn: T, limit: number) {
  const lastRef = useRef<{ timer: number; tiggerArgs?: any[] }>();
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const run = useCallback((args: any[]) => {
    fnRef.current.apply(undefined, args);
    const timer = setTimeout(() => {
      const lastArgs = lastRef.current?.tiggerArgs;
      if (lastArgs !== undefined) run(lastArgs); // 冷却期间有重新调用，那在冷却后触发调用
      lastRef.current = undefined;
    }, limit);
    lastRef.current = { timer };
  }, []);
  return useCallback((...args: any[]) => {
    const last = lastRef.current;
    if (last === undefined) run(args);
    else last.tiggerArgs = args;
  }, []);
}
