# Handoff — prototype-comments MVP: JSON export / import

## Next session's mission

Cut the MVP for `@org/prototype-comments`. The remaining gap: **a reviewer can hand their comments to the person who will address them**, without that person needing the comments-server running.

Two features to ship:

1. **Export to JSON, from the reviewer.** From the widget itself (probably a button in the FAB menu or a panel) — produces a single file containing every comment for the current page (or project) so the reviewer can email/Slack it.
2. **Import from JSON, for the person addressing the comments.** Drop the file in, see the same pins on the same elements, work through them.

Treat this as the "no-backend escape hatch": the localStorage adapter works alone today, but you can't move comments between machines without the server. Export/import closes that loop.

## Where we are right now

- Branch: `main`, clean.
- Last commit: `c57802b docs: add vision, architecture, and per-package READMEs`.
- Two packages shipped, both working end-to-end:
  - `packages/prototype-comments` — script-tag widget, ESM + IIFE
  - `packages/comments-server` — Hono + SQLite, project-key auth

Don't re-explain any of that — it's all in:

- `README.md` — workspace layout + quick start
- `docs/vision.md` — product vision, phases, what we're NOT building
- `docs/architecture.md` — module map, anchoring strategy, storage contract, server data model
- `packages/prototype-comments/README.md` — public API, storage adapters, config
- `packages/comments-server/README.md` — REST API, env vars, deploy notes

## What to know before designing this

A few things from the current architecture that constrain the design:

1. **The `CommentStore` interface is 4 methods** (`list`, `create`, `remove`, `onChange`) — see `packages/prototype-comments/src/types.ts`. Export/import does NOT need to be a new store; it operates on whatever store is active. Don't add `export`/`import` methods to the interface.

2. **A `Comment` is fully self-contained.** Every field needed to re-place the pin lives on the comment (anchor selectors, normalised pin, fallback coords, viewport at capture). Look at `Comment` in `packages/prototype-comments/src/types.ts`. JSON serialisation is just `JSON.stringify(comments)` — no special handling needed.

3. **Comments are scoped per page key.** Default is `location.pathname`, overridable via `config.pageKey`. The reviewer and the importer must be looking at the **same prototype URL** for pins to land — otherwise the import is just data with nowhere to render.

4. **The widget UI is currently:** a FAB → selection overlay → composer → pin → bubble. There is no "list view" or panel that lists all comments. Adding export from the FAB means either: (a) extending the FAB into a small menu (chat/export/etc.), or (b) adding a dedicated panel like SitePing's. The vision doc explicitly defers the panel — option (a) is closer to current scope.

5. **The widget is in a closed Shadow DOM.** Any new UI you add must live inside that shadow root. Styles go in `packages/prototype-comments/src/isolation/host.ts` (the `buildStyles` function).

6. **Import strategy is a real design question.** Three reasonable options worth weighing with the user:
   - **Replace** — wipe local comments, install imported ones. Simple. Destructive.
   - **Merge** — union by comment `id`. Safer. Needs dedupe on `id` collisions.
   - **Side-by-side** — keep both sets, render with different colours. Most flexible. Most UI work.

   My guess: start with **merge**, with a clear "discard local first" toggle. But ask.

7. **Reference implementations:**
   - `external/siteping/packages/widget/src/panel.ts` — has an export button (CSV/JSON) and bulk actions. Worth a read for UX patterns.
   - `external/faster-fixes` — simpler, no export today.
   - Treat both as **read-only**. We adapt, we don't link.

## Suggested first questions to put to the user

Use `AskUserQuestion`, don't guess:

1. **Scope of export:** current page only, current project (all pages), or both as options?
2. **Import collision behaviour:** replace / merge / side-by-side?
3. **Surface for the buttons:** extend the FAB into a small menu, or add a tiny panel (drawer from the side)?
4. **File shape:** raw `Comment[]` JSON, or wrap it in `{ version, exportedAt, projectId?, comments }` envelope so we can evolve format later? (Strong recommend the envelope.)

## Implementation pointers

When the user has steered the questions above:

- New module: `packages/prototype-comments/src/io/exportImport.ts` (or `serialization/`) — keep it pure-function, no UI, no DOM. Two functions: `exportComments(comments): string` and `importComments(json): { ok: true; comments } | { ok: false; error }`.
- Validation on import: same Zod-shaped check as the server (re-declare a minimal client-side schema; don't add a runtime Zod dep to the library unless you also pull it into the bundle, which adds ~12kb).
- UI: small "Export comments" / "Import comments" entries somewhere. If extending the FAB into a menu, follow the pattern in `packages/prototype-comments/src/ui/fab.ts` — currently single-click toggle.
- Trigger download via `Blob` + `URL.createObjectURL` + a transient `<a download>` element.
- Trigger import via a hidden `<input type="file" accept="application/json">`.
- After import, call `store.create(...)` for each accepted comment so it lands in whatever adapter is active (works for localStorage and HTTP without any branching).
- The pin layer's `onChange` listener will refresh automatically once the store fires.

## Tests / verification

There's no test suite yet. Verify by:

1. Boot demo with localStorage adapter, leave 3 comments, export.
2. Open demo in incognito (or `localStorage.clear()`), import the JSON, verify pins re-render at the right elements.
3. Edit the demo HTML slightly (rename a class), reload, verify smart-scan still resolves.
4. With the HTTP adapter + server running, importing should `POST` each comment to the server.

## Don't drift past

- Don't make export/import imply server changes. The server is fine as-is; this is a client-side feature.
- Don't add threading, resolve/reopen, screenshots, accounts, or any other Phase 2+ feature — see `docs/vision.md` boundary section.
- Don't introduce a side panel as part of this. If a panel emerges, it's a separate scope conversation.

## Suggested skills for the next session

- `shaping` — if the import collision question expands into a "reviewer role vs builder role" conversation. The likely path before any code.
- `breadboarding` — to map the export / import affordances against the existing FAB + composer + bubble surfaces before adding a new one.
- `prototype` — if the FAB menu vs side panel decision is contested, build 2–3 throwaway UI variants and pick.
- `tdd` — the pure `exportComments` / `importComments` functions are an obvious red-green-refactor target; the rest of the codebase has no tests, so this is also a chance to introduce a small vitest setup if the user wants.
- `simplify` — at the end, sweep the new code against the rest of the library for consistency.
- `to-prd` or `to-issues` — only if the user wants to formalise the MVP scope into a tracked artifact before building. Most likely overkill for a single-session feature.

## Auto-mode etiquette

The session is in auto-mode. The user wants execution. After clarifying the four open questions above, ship the MVP without further prompts unless something genuinely needs a decision.
