export type RequestRecord = {
  method: string;
  url: string;
  pattern: string;
  status: number | "blocked" | "pending";
  timestamp: number;
};

export type BlockKey = string; // "GET /api/users/:id"

function makeBlockKey(method: string, pattern: string): BlockKey {
  return `${method.toUpperCase()} ${pattern}`;
}

/**
 * Collapse parameterized URL segments into :id patterns.
 * Heuristic: UUIDs, numeric IDs, and hex strings > 8 chars.
 */
export function collapseToPattern(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    const segments = parsed.pathname.split("/");
    const collapsed = segments.map((seg) => {
      if (!seg) return seg;
      // UUID
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          seg
        )
      )
        return ":id";
      // Pure numeric
      if (/^\d+$/.test(seg)) return ":id";
      // Long hex string (mongo ObjectId, etc.)
      if (/^[0-9a-f]{8,}$/i.test(seg)) return ":id";
      return seg;
    });
    return collapsed.join("/");
  } catch {
    return url;
  }
}

export type DebuggerStore = {
  blocklist: Map<BlockKey, boolean>;
  requests: RequestRecord[];
  notes: Map<BlockKey, string>;
  listeners: Set<() => void>;
  version: number;
};

export function createStore(): DebuggerStore {
  return {
    blocklist: new Map(),
    requests: [],
    notes: new Map(),
    listeners: new Set(),
    version: 0,
  };
}

export function setNote(
  store: DebuggerStore,
  method: string,
  pattern: string,
  text: string
) {
  const key = makeBlockKey(method, pattern);
  if (text) {
    store.notes.set(key, text);
  } else {
    store.notes.delete(key);
  }
  notify(store);
}

export function getNote(
  store: DebuggerStore,
  method: string,
  pattern: string
): string {
  return store.notes.get(makeBlockKey(method, pattern)) ?? "";
}

function notify(store: DebuggerStore) {
  store.version++;
  store.listeners.forEach((fn) => fn());
}

export function toggleBlock(
  store: DebuggerStore,
  method: string,
  pattern: string
) {
  const key = makeBlockKey(method, pattern);
  const current = store.blocklist.get(key) ?? false;
  store.blocklist.set(key, !current);
  notify(store);
}

export function isBlocked(
  store: DebuggerStore,
  method: string,
  pattern: string
): boolean {
  return store.blocklist.get(makeBlockKey(method, pattern)) ?? false;
}

export function patchFetch(store: DebuggerStore): () => void {
  const originalFetch = window.fetch;

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const url =
      input instanceof Request
        ? input.url
        : input instanceof URL
          ? input.href
          : input;
    const method = (
      init?.method ??
      (input instanceof Request ? input.method : "GET")
    ).toUpperCase();
    const pattern = collapseToPattern(url);

    if (isBlocked(store, method, pattern)) {
      const record: RequestRecord = {
        method,
        url,
        pattern,
        status: "blocked",
        timestamp: Date.now(),
      };
      store.requests.push(record);
      notify(store);
      throw new TypeError("Failed to fetch");
    }

    const record: RequestRecord = {
      method,
      url,
      pattern,
      status: "pending",
      timestamp: Date.now(),
    };
    store.requests.push(record);
    notify(store);

    try {
      const response = await originalFetch(input, init);
      record.status = response.status;
      notify(store);
      return response;
    } catch (err) {
      record.status = 0;
      notify(store);
      throw err;
    }
  };

  // Return unpatch function
  return () => {
    window.fetch = originalFetch;
  };
}
