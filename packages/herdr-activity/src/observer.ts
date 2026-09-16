import type { ActivitySnapshot } from './model.js';
import { normalizeInventory, reduceActivity } from './normalize.js';
import { readList } from './transport.js';
export interface ObserverOptions {
  socketPath: string;
  pollMs?: number;
  timeoutMs?: number;
  attentionHoldMs?: number;
}
export interface ActivityObserver {
  getSnapshot(): ActivitySnapshot;
  subscribe(listener: (snapshot: ActivitySnapshot) => void): () => void;
  start(): void;
  stop(): void;
}
export function createObserver(options: ObserverOptions): ActivityObserver {
  const pollMs = options.pollMs ?? 2000,
    timeoutMs = options.timeoutMs ?? 3000,
    holdMs = options.attentionHoldMs ?? 30000;
  if (
    !options.socketPath ||
    !Number.isFinite(pollMs) ||
    pollMs <= 0 ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0 ||
    !Number.isFinite(holdMs) ||
    holdMs < 0
  )
    throw new Error('Invalid observer options');
  let snapshot: ActivitySnapshot = {
    version: 1,
    revision: 0,
    endpoint: options.socketPath,
    connection: { state: 'connecting', lastSuccessAt: null, error: null },
    workspaces: [],
    panes: [],
  };
  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<(snapshot: ActivitySnapshot) => void>();
  const getSnapshot = () => structuredClone(snapshot);
  const publish = () => {
    for (const listener of listeners) {
      try {
        listener(getSnapshot());
      } catch {
        /* Consumers cannot break observation. */
      }
    }
  };
  const poll = async (run: AbortController) => {
    try {
      const results = await Promise.allSettled([
        readList(options.socketPath, 'agent.list', timeoutMs, run.signal),
        readList(options.socketPath, 'pane.list', timeoutMs, run.signal),
        readList(options.socketPath, 'workspace.list', timeoutMs, run.signal),
      ]);
      if (run.signal.aborted) return;
      const lists = results.map((result) => {
        if (result.status === 'rejected') throw result.reason;
        return result.value;
      });
      snapshot = reduceActivity(
        snapshot,
        normalizeInventory(lists[0], lists[1], lists[2]),
        Date.now(),
        holdMs
      );
    } catch (error) {
      if (run.signal.aborted) return;
      snapshot = {
        ...snapshot,
        revision: snapshot.revision + 1,
        connection: {
          ...snapshot.connection,
          state: 'disconnected',
          error: error instanceof Error ? error.message : 'Herdr unavailable',
        },
      };
    }
    publish();
    if (!run.signal.aborted) timer = setTimeout(() => void poll(run), pollMs);
  };
  return {
    getSnapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start() {
      if (controller) return;
      const run = new AbortController();
      controller = run;
      snapshot = {
        ...snapshot,
        revision: snapshot.revision + 1,
        connection: {
          ...snapshot.connection,
          state: 'connecting',
          error: null,
        },
      };
      publish();
      if (!run.signal.aborted) void poll(run);
    },
    stop() {
      if (!controller) return;
      controller.abort();
      controller = undefined;
      clearTimeout(timer);
      snapshot = {
        ...snapshot,
        revision: snapshot.revision + 1,
        connection: {
          ...snapshot.connection,
          state: 'disconnected',
          error: 'Observer stopped',
        },
      };
      publish();
    },
  };
}
