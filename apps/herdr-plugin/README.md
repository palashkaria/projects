# Herdr Activity plugin

An original, small Herdr plugin showing workspace groups, raw working/blocked/idle/unknown states, recent observed activity, an explicitly inferred turn-ended mark, and connection health. Plain symbols; no font assets, theme changes, transcript scans, task database, pane controls or provider calls.

The native surface is a **popup**, not a replacement sidebar. It leaves Herdr's sidebar settings and other plugins alone. The popup reads the same observer API that a sibling browser app can consume. One explicit foreground server process does the Herdr reads; opening a popup does not spawn another observer. No install or startup hook silently launches a daemon.

## Build and run

Requirements: Node 22+, pnpm workspace dependencies, Herdr 0.9.0+ on macOS/Linux. The checked-in manifest uses the bundled `dist/main.js`; build before linking or invoking it.

```sh
pnpm install --frozen-lockfile
pnpm nx run @org/herdr-plugin:build
pnpm nx run @org/herdr-plugin:serve
# Or choose one explicit Herdr endpoint and API port:
node apps/herdr-plugin/dist/main.js serve --socket /path/to/herdr.sock --port 43187
# In another terminal (works without installing the plugin):
node apps/herdr-plugin/dist/main.js popup --api-url http://127.0.0.1:43187
```

`HERDR_SOCKET_PATH` or `HERDR_CONFIG_PATH` selects the observed server; `HERDR_ACTIVITY_PORT` overrides the API port. The popup accepts `HERDR_ACTIVITY_API_URL`. The API binds only 127.0.0.1 and rejects foreign Host/Origin requests. Ctrl-C stops the foreground observer. Popup q/Esc closes its own display; arrow keys scroll. The observer is needed even when this plugin is installed. If the sibling UI embeds an observer instead, point the popup at that API and do not run a second one.

## Optional later installation

This task does not install, link, enable, open Herdr panes or modify Herdr user configuration. After review, a human can link the built `apps/herdr-plugin` directory using Herdr's plugin CLI, then invoke its **Open activity** action. The manifest declares the activity popup and setup/unsetup actions. There are no automatic build/startup/event hooks. Link from this built workspace; a GitHub installer without its build output is not supported.

## Reversible setup

Setup is optional: defaults work without it. It saves only this plugin's API connection file (`$HERDR_PLUGIN_CONFIG_DIR/activity.json`, otherwise `~/.config/herdr/plugins/config/local.herdr-activity/activity.json`, honoring XDG). It does **not** install/enable the plugin or change Herdr's `config.toml`.

```sh
node apps/herdr-plugin/dist/main.js setup --api-url http://127.0.0.1:43187
node apps/herdr-plugin/dist/main.js unsetup
# Safe isolated demonstration:
node apps/herdr-plugin/dist/main.js setup --config /tmp/activity-demo/activity.json
node apps/herdr-plugin/dist/main.js unsetup --config /tmp/activity-demo/activity.json
```

Setup exclusively creates the file, or accepts an identical file. It refuses to overwrite existing content. Unsetup removes only a recognized canonical owned file, preserving foreign/edited content. It leaves directories and any unrelated files in place. It does not stop an independently launched server or unlink the plugin; Ctrl-C stops the server and Herdr's own unlink command removes a future link.

## Verification and limits

```sh
NX_DAEMON=false NX_NO_CLOUD=true pnpm nx run-many -t test typecheck build -p @org/herdr-plugin @org/herdr-activity
pnpm nx format:check --projects=@org/herdr-plugin,@org/herdr-activity
```

Tests use fake Unix sockets, synthetic lifecycle transitions, loopback HTTP/SSE and temporary setup directories. No live workers or existing panes are used. API fields were checked against the installed Herdr protocol 22 schema, but live plugin installation/rendering is deliberately unverified. There is no historical session discovery, multi-server aggregation, worktree tree or persisted attention. Three list reads are not an atomic Herdr snapshot; rapidly changing topology can be briefly inconsistent until the next poll. Updates can lag by a poll plus request timeout. Restart loses observed activity history. Upstream `done` is preserved as `reportedStatus` and normalized to unknown; no state asserts task success. See the [shared package](../../packages/herdr-activity/README.md) for protocol semantics and UI integration.
