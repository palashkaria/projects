# Herdr activity

Small read-only observer and versioned activity contract for the native Herdr activity plugin and a sibling browser UI. Node 22+; browser consumers import only `@org/herdr-activity/model`. Source exports are compiled by the consuming app; this library has no separate build.

```ts
import {
  createObserver,
  createActivityServer,
  resolveSocketPath,
} from '@org/herdr-activity';
const observer = createObserver({ socketPath: resolveSocketPath() });
const server = await createActivityServer(observer, { port: 43187 });
observer.start();
// On shutdown:
await server.close();
observer.stop();
```

The observer only sends `agent.list`, `pane.list`, and `workspace.list`, in one non-overlapping poll every two seconds after the last completes. Each response has a 3-second deadline and a 4 MiB limit. All three lists must succeed before inventory changes. There is no CLI fallback or transcript access. Socket selection: explicit option, then `HERDR_SOCKET_PATH`, then the directory of `HERDR_CONFIG_PATH`, otherwise `$XDG_CONFIG_HOME/herdr/herdr.sock` (default `~/.config/herdr/herdr.sock`). Only macOS/Linux are supported by the plugin manifest.

`getSnapshot()` returns an isolated copy. `subscribe(listener)` receives subsequent changes and returns an unsubscribe function; take an initial snapshot explicitly. `start()`/`stop()` are idempotent; stop cancels requests and timers. Failed reads retain the last complete inventory and last successful timestamp, with `connection.state = 'disconnected'`. Polling retries automatically; successful reads restore `connected`. No history is persisted.

See [model.ts](src/model.ts) for v1 types, runtime validation, grouping and symbols. `reportedStatus` preserves the exact upstream string. `rawStatus` recognizes working/blocked/idle and uses unknown for all other values, including Herdr's `done`. `attention = 'turn-ended'` means an observed working→idle transition within a continuous connection, held for 30 seconds by default; it never proves task success. Unknown initial activity remains null. Consumers must suppress attention when disconnected and mark the entire retained inventory stale. Session IDs do not deduplicate attachments. Empty workspaces and shell panes remain in inventory. Recent activity records observed state changes/working polls, not transcript or message timestamps.

Loopback HTTP API:

- `GET /api/v1/snapshot`: full `ActivitySnapshot` JSON, version 1.
- `GET /api/v1/events`: SSE `event: snapshot`, revision as `id`, complete JSON as `data`; immediate initial snapshot, then updates. Heartbeat every 15 seconds. At most 32 clients; slow readers are disconnected.
- Other routes return 404, non-GET returns 405, foreign Host/Origin returns 403. No CORS or mutation routes. Use the exact printed `http://127.0.0.1:PORT` origin.

A browser app should proxy these two routes through its same-origin server, or embed this observer and supply its own read-only routes. Run one observer for both consumers; do not start one per browser tab. When the HTTP connection itself fails, the browser must also mark its cached snapshot stale. Caller owns observer startup/shutdown separately from the HTTP server. The server exposes titles, paths and session identifiers to local processes and intentionally has no remote binding option.

Verify: `NX_DAEMON=false NX_NO_CLOUD=true pnpm nx run-many -t test typecheck -p @org/herdr-activity`.
