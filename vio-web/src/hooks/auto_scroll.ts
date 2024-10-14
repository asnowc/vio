import { useCallback, useEffect, useRef } from "react";

/**
 * 控制列表自动滚动
 */
export function useAutoScroll(props: {
  /** 默认是否为锁定关闭自动滚动状态 */
  defaultLock?: boolean;
  /** 列表容器，用于判断是否滚动到底部 */
  container?: HTMLElement | null;
  /** 当锁定状态变化时调用 */
  onLockChange?(lock: boolean): void;
  /** 依赖变化时，如果当前为锁定状态，则自动滚动到底部 */
  deps: any[];
}) {
  const { container, onLockChange, defaultLock = true, deps } = props;
  /** 是否锁定自动滚动 */
  const lockRef = useRef(defaultLock);
  const containerRef = useRef<HTMLElement | null>();
  containerRef.current = container;
  const onLockChangeRef = useRef(onLockChange);
  onLockChangeRef.current = onLockChange;

  const lockScroll = useCallback((lock: boolean) => {
    if (lockRef.current === lock) return;
    lockRef.current = lock;
    onLockChangeRef.current?.(true);
  }, []);

  const scrollToBottom = useCallback((lock?: boolean, behavior?: "instant" | "smooth") => {
    const dom = containerRef.current;
    if (!dom) return;
    let offset = dom.scrollHeight - dom.clientHeight;
    if (offset === 0) return;
    if (lock !== undefined) lockScroll(lock);

    if (behavior === undefined) behavior = offset - dom.scrollTop > 1080 ? "instant" : "smooth";

    dom.scroll({ behavior: behavior, top: offset });
    isUserScroll.current = false;
  }, []);

  const isUserScroll = useRef(true);
  const onscrollEnd = useCallback(() => {
    isUserScroll.current = true;
  }, []);
  const onScroll = useCallback((e: Event) => {
    if (!isUserScroll.current) return;
    const dom = containerRef.current;
    if (!dom) return;

    const threshold = 1;
    const { scrollHeight, scrollTop, clientHeight } = dom;
    let isBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    lockScroll(isBottom);
  }, []);
  useEffect(() => {
    if (!container) return;
    container.addEventListener("scroll", onScroll);
    container.addEventListener("scrollend", onscrollEnd);
    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [container]);
  useEffect(() => {
    if (lockRef.current) scrollToBottom();
  }, deps);
  return {
    /** 立即滚动到底部 */
    scrollToBottom,
  };
}
