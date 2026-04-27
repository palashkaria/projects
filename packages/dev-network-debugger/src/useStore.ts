import { useSyncExternalStore, useCallback, useRef } from "react";
import type { DebuggerStore } from "./interceptor";

type Snapshot = {
  requests: DebuggerStore["requests"];
  blocklist: DebuggerStore["blocklist"];
  _version: number;
};

export function useDebuggerStore(store: DebuggerStore) {
  const cacheRef = useRef<Snapshot | null>(null);
  const versionRef = useRef(-1);

  const subscribe = useCallback(
    (callback: () => void) => {
      store.listeners.add(callback);
      return () => store.listeners.delete(callback);
    },
    [store]
  );

  const getSnapshot = useCallback((): Snapshot => {
    const version = store.version;
    if (cacheRef.current && versionRef.current === version) {
      return cacheRef.current;
    }
    const snap: Snapshot = {
      requests: store.requests,
      blocklist: store.blocklist,
      _version: version,
    };
    cacheRef.current = snap;
    versionRef.current = version;
    return snap;
  }, [store]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
