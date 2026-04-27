import React, { useEffect, useRef, useState } from "react";
import { createStore, patchFetch } from "./interceptor";
import { DebuggerPanel } from "./Panel";

/**
 * Drop-in component that patches fetch and renders the debugger overlay.
 * Gate behind import.meta.env.DEV in your app:
 *
 *   {import.meta.env.DEV && <DevNetworkDebugger />}
 */
export function DevNetworkDebugger() {
  const storeRef = useRef(createStore());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unpatch = patchFetch(storeRef.current);
    return () => {
      unpatch();
    };
  }, []);

  // Only render client-side — SSR returns null
  if (!mounted) return null;

  return <DebuggerPanel store={storeRef.current} />;
}
