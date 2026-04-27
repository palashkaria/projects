---
shaping: true
---

# Dev Network Debugger — Shaping

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| R0 | Test what happens when API requests fail, without manual DevTools work | Core goal |
| R1 | See which endpoints the app is hitting and toggle block/unblock per endpoint | Must-have |
| R2 | Take notes per endpoint about observed behavior when blocked | Must-have |
| R3 | Copy a structured report (endpoint + observation) ready to paste to AI | Must-have |
| R4 | Know which endpoints are new/changed based on recent git commits | Must-have |
| R5 | Group parameterized URLs into patterns (e.g. `/sessions/:id`), expandable to see individual URLs | Must-have |
| R6 | Block by method + URL independently (GET vs PUT to same path) | Must-have |
| R7 | Never ship to production (tree-shaken out) | Must-have |
| R8 | Zero setup for any dev on the team (no extension install) | Must-have |

---

## Shape A: Monkey-patch fetch + git-aware overlay (Selected)

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **Fetch interceptor** — wrap `window.fetch` to record every request and check a blocklist keyed by `method + URL pattern`; blocked requests throw `TypeError('Failed to fetch')` | |
| **A2** | **Floating panel UI** — draggable overlay (React component), gated behind `import.meta.env.DEV`, shows endpoint list with block/unblock toggles | |
| **A3** | **Endpoint discovery** — endpoints populate by observing live fetch calls; parameterized paths collapsed into patterns using generic heuristic (UUIDs, numeric IDs), expandable on demand | |
| **A4** | **Git integration** — dev server exposes `/__debugger/git` endpoint that shells out to `git log`/`git diff`; overlay fetches this on mount and highlights endpoints from changed files as "new/changed" | |
| **A5** | **Notes & report** — text field per endpoint, "Copy Report" button formats all notes into structured markdown with git context (commit hash, changed files) | |

---

## Fit Check: R × A

| Req | Requirement | Status | A |
|-----|-------------|--------|---|
| R0 | Test what happens when API requests fail, without manual DevTools work | Core goal | ✅ |
| R1 | See which endpoints the app is hitting and toggle block/unblock per endpoint | Must-have | ✅ |
| R2 | Take notes per endpoint about observed behavior when blocked | Must-have | ✅ |
| R3 | Copy a structured report ready to paste to AI | Must-have | ✅ |
| R4 | Know which endpoints are new/changed based on recent git commits | Must-have | ✅ |
| R5 | Group parameterized URLs into patterns, expandable | Must-have | ✅ |
| R6 | Block by method + URL independently | Must-have | ✅ |
| R7 | Never ship to production | Must-have | ✅ |
| R8 | Zero setup for any dev on the team | Must-have | ✅ |

---

## Detail A: Breadboard

### Places

| # | Place | Description |
|---|-------|-------------|
| P1 | Debugger Panel | Floating dev overlay — endpoint list, toggles, notes, report |
| P2 | Dev Server | `/__debugger/git` endpoint for git data |

### UI Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| U1 | P1 | panel | drag handle | drag | — | — |
| U2 | P1 | panel | minimize button | click | — | — |
| U3 | P1 | endpoint-list | endpoint rows | render | — | — |
| U4 | P1 | endpoint-row | method badge (GET/POST/...) | render | — | — |
| U5 | P1 | endpoint-row | URL pattern | render | — | — |
| U6 | P1 | endpoint-row | block/unblock toggle | click | → N3 | — |
| U7 | P1 | endpoint-row | "changed" git badge | render | — | — |
| U8 | P1 | endpoint-row | status indicator (200, blocked) | render | — | — |
| U9 | P1 | endpoint-row | expand arrow | click | — | — |
| U10 | P1 | endpoint-row | individual URLs (expanded) | render | — | — |
| U11 | P1 | endpoint-row | notes field | type | → S4 | — |
| U12 | P1 | panel | Copy Report button | click | → N9 | — |

### Code Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| N1 | P1 | interceptor | `patchFetch()` | call (on init) | wraps `window.fetch` with N2 | — |
| N2 | P1 | interceptor | `interceptedFetch(url, opts)` | call (every fetch) | check S1, record → S2, → N5, → N4 | — |
| N3 | P1 | interceptor | `toggleBlock(method, pattern)` | call | → S1 | — |
| N4 | P1 | interceptor | `captureCallSite()` via `new Error().stack` | call | — | → S2 |
| N5 | P1 | pattern | `collapseToPattern(url)` — UUIDs, numeric IDs → `:id` | call | — | → N2 |
| N6 | P1 | git | `fetchGitData()` | call (on mount) | → N11 | → S3 |
| N7 | P1 | git | `matchEndpointToGit(callSite, changedFiles)` | call | reads S2, S3 | → U7 |
| N8 | P1 | panel | `renderEndpoints()` — groups S2 by pattern, cross-refs S1, S3 | call | → U3–U10 | — |
| N9 | P1 | report | `formatReport()` — builds markdown from S1, S2, S3, S4 | call | → N10 | — |
| N10 | P1 | report | `copyToClipboard(text)` | call | → S5 | — |
| N11 | P2 | server | `GET /__debugger/git` — shells out to `git log`/`git diff` | call | → N12 | → N6 |
| N12 | P2 | server | `parseGitDiff()` — extracts changed files, commit metadata | call | — | → N11 |

### Data Stores

| # | Place | Store | Description |
|---|-------|-------|-------------|
| S1 | P1 | `blocklist` | `Map<"METHOD /pattern", boolean>` |
| S2 | P1 | `observedRequests` | Array of `{method, url, pattern, status, callSite, timestamp}` |
| S3 | P1 | `gitData` | `{commits: [{hash, message, files}], changedFiles: string[]}` |
| S4 | P1 | `notes` | `Map<"METHOD /pattern", string>` |
| S5 | — | Clipboard | Browser clipboard (external) |

### Key Wiring Flows

**Request intercepted:**
`window.fetch()` → N2 → N5 (collapse URL) → N4 (capture stack) → check S1 → if blocked: throw `TypeError('Failed to fetch')` / if allowed: call real fetch, write result to S2 → N8 re-renders U3–U10

**User blocks endpoint:**
U6 click → N3 → writes S1 → next fetch to that pattern throws

**Git badge:**
mount → N6 → N11 → N12 (git shell) → S3 → N7 matches S2 call sites against S3 changed files → U7 renders badge

**Copy report:**
U12 click → N9 reads S1 (what's blocked), S2 (requests), S3 (git context), S4 (notes) → formats markdown → N10 → S5 (clipboard)

---

## Slices

| # | Slice | Parts | Affordances | Demo |
|---|-------|-------|-------------|------|
| V1 | Intercept + Panel + Block | A1, A2, A3 | U1–U6, U8–U10, N1–N5, N8, S1, S2 | "Browse app, endpoints appear grouped. Toggle block, refresh — request fails, status shows 'blocked'" |
| V2 | Notes + Copy Report | A5 | U11, U12, N9, N10, S4, S5 | "Block endpoint, type 'stuck on loading', click Copy Report — formatted markdown in clipboard" |
| V3 | Git Integration | A4 | U7, N4, N6, N7, N11, N12, S3 | "Panel shows 'changed' badge on endpoints from recently modified files" |

### Known Limitations

- **V3 call site matching**: Uses `new Error().stack` to capture file paths from stack traces. Works well in dev mode with source maps (Vite/webpack show original paths). Won't work with bundled/minified code — acceptable since this is dev-only.

---

## Decisions Log

- **Blocking mechanism**: Monkey-patch `window.fetch` (not MSW, not Chrome extension). Simpler, zero deps, sufficient for API calls.
- **Git bridge**: Dev server endpoint (`/__debugger/git`), not build-time injection or manual paste.
- **URL collapsing**: Generic heuristic (UUIDs, numeric IDs) — not app-specific patterns.
- **Method granularity**: Block by URL pattern + HTTP method independently.
