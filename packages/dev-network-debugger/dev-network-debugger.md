# Dev Network Debugger

Internal dev tool for testing UI resilience to backend failures.

## Problem

Testing error/degraded states in the frontend is manual and tedious. The current workflow is:

1. Open Chrome DevTools Network tab
2. Block a request URL
3. Refresh the page and observe what happens
4. Take a screenshot
5. Paste it to an AI chatbot or write up the issue
6. Unblock, repeat for the next endpoint

This is high-friction per endpoint, easy to forget which endpoints you've tested, and there's no structured way to capture observations.

## Proposal

An npm package (`packages/dev-network-debugger`) that provides a dev-mode overlay panel for systematically testing what happens when network requests fail.

### How It Works

1. **Intercept layer** — Monkey-patch `window.fetch` (and optionally `XMLHttpRequest`) to:
   - Record every request (URL, method, status, timing)
   - Check a blocklist before executing — if blocked, throw a `TypeError('Failed to fetch')` to simulate network failure

2. **Floating panel UI** — A small draggable overlay rendered in-app (only in dev mode) showing:
   - List of observed endpoints, grouped/deduplicated by URL pattern
   - Toggle switch per endpoint to block/unblock
   - Status indicator (last seen status code, blocked, etc.)
   - Notes field per endpoint for recording observations

3. **Copy report** — Formats all notes into a structured report for pasting into a ticket or AI conversation:
   ```
   ## Network Resilience Test — 2026-03-25

   - `GET /_ui/api/chat/config` — BLOCKED -> Shows setup screen instead of error (BUG)
   - `GET /_ui/api/chat/sessions` — BLOCKED -> History dropdown hidden, no indication (BUG)
   - `GET /_ui/api/chat/sessions/:id` — BLOCKED -> Silent failure, OK (minor)
   ```

## Design Considerations

### URL grouping

Many requests hit parameterized paths (e.g., `/sessions/abc123`, `/sessions/def456`). The tool should collapse path params into patterns like `/sessions/:id` so the blocklist works at the endpoint level, not per-individual-request.

### Blocking granularity

Block by URL pattern + HTTP method. `GET` vs `PUT` to the same path represent different failure modes and should be independently toggleable.

### Production safety

Must be tree-shaken out of production builds. Gate the import behind `import.meta.env.DEV` so it never ships to users.

### Form factor

An npm package in the monorepo is preferred over a Chrome extension. Reasons:
- No extension installation or Chrome Web Store publishing required
- Works immediately for any dev on the team
- Tightly integrated with the app's dev server lifecycle
- Simpler to build and maintain

## Scope

### v1

- Fetch interceptor with block/unblock capability
- React overlay panel with endpoint list and toggles
- Notes field per endpoint
- Copy report button

### v2 (future)

- Git integration: parse recent commits to highlight new/changed endpoints vs existing ones, focusing attention on what changed
- Persist block/note state across page reloads (localStorage)
- Bulk operations (block all, unblock all)
- Delay simulation (slow responses) in addition to full blocks

## Location

`packages/dev-network-debugger/` in the platform monorepo.
