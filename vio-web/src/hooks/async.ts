import { useCallback, useRef, useState } from "react";

export type UseAsyncResult<T, A extends any[]> = {
  run(...args: A): Promise<T>;
  loading: boolean;
  res?: T;
};

export function useAsync<T, A extends any[] = []>(fn: (...args: A) => Promise<T> | T): UseAsyncResult<T, A> {
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<T>();
  const fnRef = useRef(fn);
  const loadingPromise = useRef<Promise<any>>();
  fnRef.current = fn;
  const run = useCallback((...args: A) => {
    const promise = fnRef.current(...args);
    if (promise instanceof Promise) {
      setLoading(true);
      loadingPromise.current = promise;
      promise
        .then((res) => {
          const symbol = loadingPromise.current;
          if (symbol === promise || symbol === undefined) setResponseData(res);
        })
        .finally(() => {
          const symbol = loadingPromise.current;
          if (symbol === promise || symbol === undefined) {
            setLoading(false);
          }
          loadingPromise.current = undefined;
        });
      return promise;
    } else {
      loadingPromise.current = undefined;
      setLoading(false);
      setResponseData(promise);
    }
    return Promise.resolve(promise);
  }, []);

  return {
    run,
    loading,
    res: responseData,
  };
}
