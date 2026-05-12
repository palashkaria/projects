# Architecture

How the pieces fit together. For why we made these calls, see [vision.md](./vision.md).

## Two packages

```
┌─ host prototype (any HTML/JS) ──────────────────────────────────────────┐
│                                                                         │
│  <script src=".../prototype-comments.global.js"></script>               │
│  <script>                                                               │
│    PrototypeComments.initPrototypeComments({                            │
│      store: PrototypeComments.createHttpStore({ endpoint, projectId,    │
│                                                  projectKey })          │
│    });                                                                  │
│  </script>                                                              │
│                                                                         │
│  ┌─ <prototype-comments-root>  (closed Shadow DOM) ──────────────────┐  │
│  │  FAB · selection overlay · bbox highlight · composer popover ·   │  │
│  │  identity modal · pin layer · pin bubble                         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP (opt-in; localStorage is the default)
                                  ▼
┌─ @org/comments-server (Hono + better-sqlite3) ──────────────────────────┐
│                                                                         │
│  GET    /projects/:projectId/comments?url=<url>                         │
│  POST   /projects/:projectId/comments                                   │
│  DELETE /projects/:projectId/comments/:id                               │
│  GET    /health                                                         │
│                                                                         │
│  Auth: Authorization: Bearer <projectKey>   (or ?key=…)                 │
│  Projects: PROJECTS='{"demo":"sk_…"}' in env                            │
│  Storage: SQLite (WAL), single `comments` table                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Library module map (`packages/prototype-comments/src`)

| Module | Responsibility |
|---|---|
| `index.ts` | Public entry. Wires every other module together. Exports `initPrototypeComments`, `createLocalStorageStore`, `createHttpStore`. |
| `types.ts` | The contract: `Comment`, `CommentInput`, `Identity`, `Anchor`, `PinAnchor`, `CommentStore`. Everything else imports from here. |
| `isolation/host.ts` | Mounts `<prototype-comments-root>` with a closed Shadow DOM and `adoptedStyleSheets` (Safari-fallback `<style>`). All widget UI lives inside this host. |
| `selection/overlay.ts` | Hover-element selection mode. Capture-phase mousemove tracks the element under the cursor, draws a fixed-position bbox, filters out widget elements via `data-prototype-comments` attribute. ESC cancels. |
| `anchoring/anchor.ts` | `generateAnchor(element)` — captures the six facts we need to find the element again later. |
| `anchoring/resolver.ts` | `resolveAnchor(anchor)` — five-strategy fallback chain with text verification. |
| `anchoring/xpath.ts`, `fingerprint.ts` | Helpers for the above. |
| `pins/math.ts` | `normalisePinAnchor`, `computePinPosition`. Pin position is stored as a 0–1 offset within the element; viewport coords are recomputed every scroll/resize/mutation. |
| `pins/render.ts` | Renders pins as numbered circles in a fixed-position layer inside the Shadow DOM. Owns the bubble lifecycle. |
| `composer/composer.ts` | The comment input popover. Anchored to the selected element via `@floating-ui/dom`'s `autoUpdate`. |
| `ui/fab.ts` | The floating chat button that toggles selection mode. |
| `ui/identity.ts`, `identity-dialog.ts` | Name + email modal, shown once per device. Identity persists in localStorage. |
| `storage/localStorageStore.ts` | Default `CommentStore` adapter. Cross-tab sync via the native `storage` event. |
| `storage/httpStore.ts` | HTTP adapter against `@org/comments-server`. Fingerprint-based change detection over polling. |

## The widget lifecycle

```
idle ──FAB or instance.start()──▶ selecting
                                      │
                                      │ click on element
                                      ▼
                                   composing  ◀──── identity modal (first comment only)
                                      │
                                      │ submit
                                      ▼
                                   submitting ──▶ store.create() ──▶ idle (pin renders)
```

`selecting → idle`: ESC or right-click.
`composing → idle`: Cancel button or ESC.
`submitting → idle` on success; `submitting → composing` on store error (keeps the composer open so the user can retry).

## Anchoring — five strategies, one contract

The whole library leans on this. Given an element, we capture six facts:

```ts
{
  cssSelector:  string   // @medv/finder, filtered against framework hash classes
  xpath:        string   // 6-level structural path, optimised when an id is present
  elementTag:   string   // for cheap pre-filtering
  elementId?:   string   // null if absent
  textSnippet:  string   // first 120 chars of textContent
  fingerprint:  string   // tag:childCount:siblingIndex:attrHash
  neighborText?: string  // immediate parent's text minus the element's own
}
```

To find the element again, `resolveAnchor` tries:

| # | Strategy | Confidence | Notes |
|---|---|---|---|
| 1 | `getElementById` | 1.00 | only if an `id` was captured; requires text + tag match |
| 2 | `querySelector(cssSelector)` | 0.95 | swallows `SyntaxError` if the selector has gone stale |
| 3 | `document.evaluate(xpath)` | 0.90 | swallows malformed-XPath errors |
| 4 | smart-scan | up to 0.85 | walks elements of the matching tag, scores each on text snippet (50), fingerprint (30), neighbour text (20) |

If nothing scores above `MIN_CONFIDENCE = 0.55`, the pin falls back to its stored document coordinates (`fallbackDocX/Y`). It still renders — just at the position the user originally clicked.

The pattern is W3C Web Annotation in spirit: multiple selectors, fallback chain, the most reliable one wins.

## Pin positioning

Why pins survive scroll, layout shift, and responsive resizes:

1. **Stored:** anchor (multi-selector) + pin (`{x, y}` ∈ [0,1] relative to the anchor element) + fallback document coords.
2. **On render:** `resolveAnchor()` finds the element. `computePinPosition()` reads `getBoundingClientRect()` and projects `(x, y)` to viewport coords.
3. **On scroll / resize / DOM mutation:** the same reposition loop re-reads bounding rects. A `ResizeObserver` on `document.body` catches layout shifts (images loading, fonts swapping).
4. **Pins use `position: fixed`** with viewport coords. The pin layer lives inside the Shadow DOM host, which is itself `position: fixed`. Mixing absolute and fixed gets weird inside a fixed-positioned ancestor; fixed everywhere is the simpler invariant.
5. **The bubble** uses Floating-UI's `autoUpdate` _and_ our own scroll loop, because Floating-UI's ancestor-scroll detection isn't reliable across the Shadow DOM boundary.

## Storage adapter contract

```ts
interface CommentStore {
  list(url: string): Promise<Comment[]>;
  create(input: CommentInput): Promise<Comment>;
  remove(id: string): Promise<void>;
  onChange(listener: () => void): Unsubscribe;
}
```

Four methods is the entire contract. Anything that can satisfy this can be a backend — Supabase, IndexedDB, a Worker + KV, a Postgres + REST API of your own.

`onChange` is how the widget knows to re-render. The localStorage adapter dispatches on a custom event for same-tab updates and listens to the native `storage` event for cross-tab. The HTTP adapter polls every 2–5 seconds and fires `onChange` only when the comment-id fingerprint actually changes.

## Server data model

One table:

```sql
CREATE TABLE comments (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL,
  url           TEXT NOT NULL,
  body          TEXT NOT NULL,
  author_name   TEXT,
  author_email  TEXT,
  anchor_json   TEXT NOT NULL,   -- the full multi-selector blob, stored opaquely
  pin_x         REAL NOT NULL,
  pin_y         REAL NOT NULL,
  placement     TEXT NOT NULL,
  fallback_doc_x REAL NOT NULL,
  fallback_doc_y REAL NOT NULL,
  viewport_w    INTEGER NOT NULL,
  viewport_h    INTEGER NOT NULL,
  created_at    INTEGER NOT NULL
);
CREATE INDEX idx_comments_project_url ON comments(project_id, url);
```

Decisions worth flagging:

- **Anchor as JSON.** We never query into it on the server. Keeping it opaque means the client can evolve the anchor shape without a migration.
- **No FK to a `projects` table.** Projects live in env vars in Phase 1. When we add a `projects` table in Phase 3 we'll add the FK then.
- **Plain `INTEGER` timestamps.** `Date.now()` everywhere, no timezone nonsense. ISO strings convert at the edge.
- **WAL mode** so reads don't block writes during polling.

## Server middleware order

```
Request
  ↓
cors (origin allow-list per env var)
  ↓
project-id middleware (resolve :projectId → expected key from PROJECTS env)
  ↓
auth middleware (Authorization: Bearer ... or ?key=...)
  ↓
route handler (zod validation inside handler)
  ↓
db queries (prepared statements via better-sqlite3)
```

Failure modes:

- Unknown `projectId` → 404 (rather than 401, so an attacker can't enumerate valid project IDs from auth failures alone).
- Missing or wrong key on a known project → 401.
- Malformed body → 400 with Zod error message.
- DB error → 500 (logged, not surfaced).

## Build & distribution

- **Library:** `tsup` → ESM (`dist/index.js`) + IIFE (`dist/index.global.js`, exposes `window.PrototypeComments`). Both bundle `@floating-ui/dom` and `@medv/finder`. Types via `tsc --emitDeclarationOnly` to a separate `tsconfig.build.json` (because `composite: true` plus `.js` import extensions trips tsup's DTS step).
- **Server:** runs via `tsx` directly from source. No build step needed for dev or self-hosting. A production bundle would be ~5 lines of additional tsup config if we want one later.

## Why closed Shadow DOM (and what it costs)

- **Wins:** Host page CSS can't bleed in; widget CSS doesn't escape. Host JS can't reach widget internals.
- **Costs:**
  - `event.target` is retargeted to the host at the document boundary — we use `event.composedPath()` for hit-testing.
  - `@floating-ui/dom`'s `autoUpdate` doesn't reliably walk ancestor scroll containers through the boundary — we trigger updates from our own scroll loop too.
  - Some browser dev tools struggle with closed shadow roots — we open them in test environments via `isTestEnv` (mirroring SitePing's pattern).

The wins are worth the costs. We do not relax this.

## Where to look next

- For UI / interaction patterns: `external/faster-fixes` (read-only submodule).
- For server-side patterns we haven't built yet (screenshot capture, retry queue, i18n, reviewer panel): `external/siteping` (read-only submodule).
- For the broader product context: [vision.md](./vision.md) and `notes/clicky-web-wedges.md`.
