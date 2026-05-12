# projects workspace

Nx + pnpm monorepo. Current focus: a drop-in widget for collecting feedback on prototypes, plus the self-hostable backend that stores it.

## What lives here

```
apps/
  safeskies-app/                  unrelated side app
packages/
  prototype-comments/             ← the widget (pure DOM, ESM + IIFE)
  comments-server/                ← Hono + SQLite backend for the widget
  dev-network-debugger/           unrelated dev tool
external/                         git submodules of reference repos (read-only)
  faster-fixes/                   hover-element interaction we adapted from
  siteping/                       Shadow-DOM + anchoring patterns we adapted from
  clicky/                         a separate exploration (Mac AI widget)
docs/
  vision.md                       why this exists + phased roadmap
  architecture.md                 how the pieces fit together
notes/                            working notes, not canonical docs
```

## Quick links

- **What we're building and why** → [docs/vision.md](./docs/vision.md)
- **How it works under the hood** → [docs/architecture.md](./docs/architecture.md)
- **Use the widget** → [packages/prototype-comments/README.md](./packages/prototype-comments/README.md)
- **Run the backend** → [packages/comments-server/README.md](./packages/comments-server/README.md)

## End-to-end demo

In one terminal, boot the server:

```bash
PROJECTS='{"demo":"sk_test_123"}' pnpm --filter @org/comments-server dev
```

In another, build the widget and serve the demo page:

```bash
pnpm --filter @org/prototype-comments build
cd packages/prototype-comments
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/demo/index.html?store=http` — the `?store=http` switches the widget from localStorage to the HTTP adapter. Leave a comment, reload, watch the pin reappear at the right element.

Drop `?store=http` to see the localStorage default — works without the server running.

## Workspace conventions

- **Package manager:** `pnpm`. Always prefix commands (`pnpm nx …`, `pnpm --filter @org/foo …`).
- **TypeScript:** strict, `customConditions: ["@org/source"]` so packages consume each other directly from `src/` in dev.
- **External clones in `external/`:** added explicitly as git submodules, opt-in to `pnpm-workspace.yaml`. Default assumption: they're for reading, not linking.
- **No project.json files yet:** packages are inferred from `package.json` via `@nx/js/typescript`.

See [CLAUDE.md](./CLAUDE.md) for the workflow instructions an AI assistant in this repo follows.

## Standard tasks

```bash
pnpm install                                          # install everything
pnpm nx typecheck @org/prototype-comments             # strict TS check on one package
pnpm nx sync                                          # refresh TS project references
pnpm --filter @org/prototype-comments build           # build distributables
pnpm --filter @org/comments-server dev                # run the backend
```
