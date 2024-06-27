import { useCallback, useDebugValue, useState } from "react";
import { createPortal } from "react-dom";

interface AddPortal {
  (...args: Parameters<typeof createPortal>): () => void;
}
/**
 * A React Hook that returns an array of portals to be rendered by the user of this hook
 * and a disposable function to add a portal. Calling dispose removes this portal from the
 * portal array
 */
export function usePortalsLifecycle(): [React.ReactPortal[], AddPortal] {
  const [portals, setPortals] = useState<React.ReactPortal[]>([]);

  useDebugValue(`Portal count: ${portals.length}`);

  const addPortal = useCallback((...args: Parameters<typeof createPortal>) => {
    const portal = createPortal(...args);
    setPortals((existingPortals) => [...existingPortals, portal]);
    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      setPortals((existingPortals) => existingPortals.filter((p) => p !== portal));
    };
  }, []);

  return [portals, addPortal];
}
