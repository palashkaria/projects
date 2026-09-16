# Herdr activity · throwaway UI prototype

Question: **Which layout best lets a developer see what agents are doing and what needs attention across workspaces?** Three structurally different layouts share one snapshot and in-memory filters. This is an experiment, not production code or an approved design.

From the workspace root:

```sh
pnpm nx run @org/herdr-manager:serve
```

Open http://127.0.0.1:43188/prototype/activity?variant=attention

- `?variant=attention`: blocked-first queue, inferred turn endings, working agents, overall inventory.
- `?variant=explorer`: workspace navigation, working-directory groups, pane details, visible empty and shell-only workspaces.
- `?variant=activity`: workspace pulse, latest observation per pane ordered by time, attention digest. **Not an event history.**

The floating switcher supports buttons and Left/Right keys (except inside inputs, selects, editable content, and dialogs). URL variants survive reload. Search, filters, workspace selection and data source stay shared while comparing layouts. Expand **Prototype state** to inspect the complete snapshot and view state. The switcher is excluded from production builds.

The fixtures contain 12 workspaces, 13 agent attachments and 3 shell panes, working/blocked/idle/unknown states, two explicitly inferred turn ends, duplicate session attachment, unknown times, long names, an empty workspace and shell-only workspace. The Connection menu simulates lost connectivity with retained inventory. Attention prioritization pauses on disconnect; retained observations never claim task success. Demo ages advance from a fixed fixture snapshot; status does not simulate work or expire attention.

## Optional live data

**Herdr is the source of truth.** The sibling plugin worker's `@org/herdr-activity` implementation is only a browser bridge: it reads Herdr's local Unix socket (which a browser cannot access directly), normalizes observations, and serves localhost HTTP/SSE. No coordinator, ledger, DB, dispatch or independent observer exists in this UI. No plugin installation is needed to use the API.

The bridge was initially delivered separately as commit `cefd84c` on `feat/herdr-activity-plugin`. At the user's subsequent request, both implementations were integrated into `main` (merge `86159b5`). From this checkout, run `pnpm nx run @org/herdr-plugin:serve`, using `HERDR_SOCKET_PATH` if the default socket resolution is not right. Then run the UI command above and select **Live read-only feed**, or open `?variant=attention&source=live`. No plugin installation is required.

The prototype serves static assets and proxies only GET `/api/v1/snapshot` and `/api/v1/events` to `127.0.0.1:43187`. The proxy supplies the backend Host and forwards no browser Origin. `HERDR_ACTIVITY_PORT` overrides that port; `HERDR_UI_PORT` overrides the UI port. The API returns contract-v1 `ActivitySnapshot`; SSE emits named `snapshot` events. The adapter validates fields, preserves unknown/null/raw status, and keeps pane attachments rather than deduplicating session IDs. Working directories are not asserted to be repository roots. Only the observer supplies inferred attention; the UI invents no task outcomes.

On feed failure the UI retains the last live inventory and marks it stale; it never substitutes demo fixtures. Before the first snapshot it shows a waiting state. EventSource reconnects automatically. The source is opt-in; opening the default URL makes no API connection.

**Current integration status:** real Herdr socket → shared API → UI proxy → browser verified on 2026-09-16. The verification snapshot contained 12 workspaces, 35 panes, and 29 agents (counts change with live activity). Initially the live view was unavailable because no bridge was running; this was resolved by starting the bridge after integration. The separate UI preview process is a development convenience; a final app should preferably serve UI assets and the socket bridge in one process, sharing the plugin's reader. Do not ship this preview server as a second permanent daemon.

## Verification and iteration

```sh
pnpm nx run @org/herdr-manager:build
# Rebuild preview assets after edits, then reload the browser:
pnpm nx run @org/herdr-manager:build:development
```

Production output is `.prototype-dist`; preview assets are `.prototype-preview`. No hot reload, persistence or mutation controls. Uses existing root esbuild and native browser JS/CSS, with no added UI dependencies. The installed Nx generators target Node apps/libraries, not a standalone static prototype; no additional plugin was installed.

Browser checks: all three desktop layouts; 390×844 mobile without document overflow; long-name wrapping; search and zero results; attention filter (4/16); raw idle versus inferred turn end in details; empty workspace; shell-only workspace; URL/keyboard switching and input-arrow exclusion; disconnected warning; live failure without demo substitution. Screenshot evidence is in ignored `evidence/` in this worktree. No elaborate test suite is appropriate for this throwaway UI.

Provisional recommendation: **Attention first** best answers what needs the user's attention; borrow the explorer as a secondary navigation mode. Activity overview is useful for monitoring motion but puts urgent items farther from the reading order. This is an implementation assessment, not a user-validated winner. Keep all variants on this throwaway branch until the user chooses.
