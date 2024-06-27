import { Listenable } from "evlib";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

/** evlib 监听 Listenable，组件卸载后自动取消监听 */
export function useListenable<T>(event: Listenable<T>, listener: (data: T) => void) {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;
  const proxyListener = useCallback((data: T) => listenerRef.current(data), []);

  useLayoutEffect(() => {
    event.on(proxyListener);
    return () => {
      event.off(proxyListener);
    };
  }, [event]);
}
/** evlib 监听 Listenable，组件卸载后自动取消监听 */
export function useListenableData<T, R>(
  event: Listenable<T> | undefined,
  listener: (data: T, beforeResult?: R) => R,
): R | undefined;
export function useListenableData<T, R>(
  event: Listenable<T> | undefined,
  listener: (data: T, beforeResult: R) => R,
  initData: R | (() => R),
): R;
export function useListenableData<T, R>(
  event: Listenable<T> | undefined,
  listener: (data: T, beforeResult?: R) => R,
  initData?: R | (() => R),
): R | undefined {
  const [data, dispatch] = useState(initData);
  const listenerRef = useRef(listener);
  listenerRef.current = listener;
  const proxyListener = useCallback((data: T) => {
    dispatch((value) => listenerRef.current(data, value));
  }, []);

  useLayoutEffect(() => {
    if (!event) return;
    event.on(proxyListener);
    return () => {
      event.off(proxyListener);
    };
  }, [event]);
  return data;
}
