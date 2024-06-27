import { useCallback, useEffect, useRef } from "react";

export function useAutoScroll(props: {
  defaultLock?: boolean;
  container?: HTMLElement | null;
  onLockChange?(lock: boolean): void;
}) {
  const { container, onLockChange, defaultLock = true } = props;
  const lockRef = useRef(defaultLock);
  const containerRef = useRef<HTMLElement | null>();
  containerRef.current = container;
  const scrollToBottom = useCallback(() => {
    const dom = containerRef.current;
    if (!dom) return;
    let offset = dom.scrollHeight - dom.clientHeight;
    if (offset === 0) return;
    dom.scroll({ behavior: "smooth", top: offset });
  }, []);

  const onScroll = useCallback((e: Event) => {
    const dom = containerRef.current;
    if (!dom) return;
    const { scrollHeight, scrollTop, clientHeight } = dom;
    let isBottom = clientHeight >= scrollHeight || scrollTop + clientHeight >= scrollHeight;
    if (isBottom && !lockRef.current) {
      lockRef.current = true;
      onLockChange?.(true);
    }
    if (!isBottom && lockRef.current) {
      lockRef.current = false;
      onLockChange?.(false);
    }
  }, []);
  useEffect(() => {
    if (!container) return;
    container.addEventListener("scroll", onScroll);
    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [container]);

  return { lockRef, scrollToBottom };
}
