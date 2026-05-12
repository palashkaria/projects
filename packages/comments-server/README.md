# @org/comments-server

Self-hostable Hono + SQLite backend for [@org/prototype-comments](../prototype-comments/README.md).

One Node process. One SQLite file. One project-key per project, configured in env. Deploy it on Fly, Railway, a VPS, a Raspberry Pi — anywhere `node` runs.

For the why, see [/docs/vision.md](../../docs/vision.md). For the data model and middleware order, see [/docs/architecture.md](../../docs/architecture.md#server-data-model).

## Run locally

```bash
PROJECTS='{"demo":"sk_test_123"}' pnpm --filter @org/comments-server dev
```

Output:

```
[comments-server] listening on http://localhost:4040
[comments-server] db: ./data/comments.db
[comments-server] projects: demo
```

The SQLite file is created on first run. Restart, ship a backup, copy it between machines — it's a single file.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PROJECTS` | `{}` | JSON object mapping `projectId → secret key`. **Required for the server to be useful.** |
| `PORT` | `4040` | HTTP port. |
| `DB_PATH` | `./data/comments.db` | Where the SQLite file lives. Parent directory is created on boot. |
| `CORS_ORIGIN` | `*` | `*` to allow any origin, or a comma-separated allow-list. |

Example with multiple projects:

```bash
PROJECTS='{"acme-design":"sk_acme_…","internal-tool":"sk_internal_…"}' \
DB_PATH=/var/lib/comments/comments.db \
CORS_ORIGIN='https://prototype.acme.com,https://staging.acme.com' \
PORT=8080 \
pnpm --filter @org/comments-server start
```

## REST API

### Auth

Every `/projects/*` route requires the project's secret key, passed either as:

- `Authorization: Bearer <key>` header (preferred), or
- `?key=<key>` query string (for environments where headers are awkward — e.g. `EventSource` later).

Failure modes:

- Unknown `projectId` → `404`
- Missing or wrong key on a known project → `401`
- Body fails Zod validation → `400` with the Zod error message
- Server error → `500` (logged, not surfaced)

### `GET /health`

Returns `{ "ok": true }`. No auth.

### `GET /projects/:projectId/comments?url=<url>`

List all comments for a given URL within a project, oldest first.

```bash
curl -H "Authorization: Bearer sk_test_123" \
  "http://localhost:4040/projects/demo/comments?url=/checkout"
```

```json
{ "comments": [ { "id": "…", "projectId": "demo", "body": "…", … } ] }
```

### `POST /projects/:projectId/comments`

Create a comment. Body schema mirrors the library's `CommentInput`:

```bash
curl -X POST \
  -H "Authorization: Bearer sk_test_123" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Should this say Subscribe?",
    "url": "/checkout",
    "author": { "name": "Palash", "email": "palash@example.com" },
    "anchor": {
      "cssSelector": ".checkout-button",
      "xpath": "/html/body/main/button",
      "elementTag": "BUTTON",
      "textSnippet": "Choose",
      "fingerprint": "button:0:2:0"
    },
    "pin": { "x": 0.5, "y": 0.5 },
    "placement": "document",
    "fallbackDocX": 240,
    "fallbackDocY": 480,
    "viewportW": 1280,
    "viewportH": 720
  }' \
  http://localhost:4040/projects/demo/comments
```

Returns `201` with `{ "comment": { … } }` including server-generated `id` and `createdAt`.

### `DELETE /projects/:projectId/comments/:id`

```bash
curl -X DELETE -H "Authorization: Bearer sk_test_123" \
  http://localhost:4040/projects/demo/comments/<id>
```

Returns `204` on success, `404` if the comment doesn't exist within the project.

## Database

Single table, no migrations yet:

```sql
CREATE TABLE comments (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL,
  url           TEXT NOT NULL,
  body          TEXT NOT NULL,
  author_name   TEXT,
  author_email  TEXT,
  anchor_json   TEXT NOT NULL,
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

The anchor blob is stored as JSON because the server never queries into it — keeping it opaque lets the client evolve the anchor shape without a schema migration.

SQLite runs in WAL mode so reads (polling from open browser tabs) don't block writes.

### Backups

It's a file. `cp ./data/comments.db ./data/comments.db.bak` works. For point-in-time consistency under load, prefer `sqlite3 ./data/comments.db ".backup './data/comments.db.bak'"`.

## Deployment notes

The server has no build step in dev — it runs via `tsx`. For production you have two reasonable options:

1. **Run `tsx` in production.** Boring but works. `node --import tsx ./src/main.ts`. Pin the Node version.
2. **Bundle to a single file.** Add a `tsup --format=cjs --target=node20 --bundle src/main.ts` build target; deploy the resulting `dist/main.js`.

Either way:

- Mount a persistent volume at `DB_PATH`.
- Set `CORS_ORIGIN` to your real prototype origins, not `*`.
- Run behind a TLS terminator (Caddy, nginx, Fly's edge).
- The `better-sqlite3` native binding needs to match the host's Node version. On Fly / Railway / Docker, that means rebuilding it inside the image. The container's Node version determines the prebuilt binary picked.

There's no graceful-shutdown drama: the server installs SIGINT/SIGTERM handlers that close the HTTP server and the SQLite connection.

## What this server is not (yet)

- No realtime — clients poll. SSE on the same Hono app is the planned upgrade.
- No accounts, no project creation API. Projects live in env vars in Phase 1.
- No rate limiting. Add `hono-rate-limiter` or a reverse-proxy rule when you need it.
- No soft delete or audit log. Deletes are immediate.
- No screenshot storage. Comments are text + anchor only.

The vision doc has the full phased plan: [/docs/vision.md](../../docs/vision.md#where-were-going).

## Development

```bash
pnpm --filter @org/comments-server dev          # tsx watch
PROJECTS='{"demo":"sk_test_123"}' \
  pnpm --filter @org/comments-server start      # one-shot
pnpm nx typecheck @org/comments-server          # strict TS check
```

The package depends on:

- `hono` — router + middleware
- `@hono/node-server` — Node adapter
- `better-sqlite3` — synchronous SQLite client
- `zod` — request body validation

No test suite yet — exercised via the demo + a handful of `curl` calls.
