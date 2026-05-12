# @org/prototype-comments

Drop-in widget for leaving comments anchored to specific elements on a prototype.

- One `<script>` tag, no framework lock-in.
- Hover an element to highlight, click to comment.
- Comments survive reloads, scrolls, and modest DOM changes via multi-selector anchoring.
- Closed Shadow DOM — your prototype's CSS and ours can't trip over each other.
- Bring your own backend: ships with localStorage and HTTP adapters; the `CommentStore` interface is four methods.

For the why, see [/docs/vision.md](../../docs/vision.md). For the how, see [/docs/architecture.md](../../docs/architecture.md).

## Install

This package is internal to the workspace and consumed as TypeScript source.

```bash
pnpm add @org/prototype-comments
```

For drop-in `<script>` usage, build the bundles once:

```bash
pnpm --filter @org/prototype-comments build
# → dist/index.js          ESM
# → dist/index.global.js   IIFE (exposes window.PrototypeComments)
# → dist/index.d.ts        types
```

## Quick start

### Script tag (any HTML)

```html
<script src="https://your-cdn/prototype-comments.global.js"></script>
<script>
  PrototypeComments.initPrototypeComments({
    accentColor: "#0066ff",
  });
</script>
```

That's a working widget with localStorage storage — fine for solo use.

### ESM (Vite / Next / anywhere)

```ts
import { initPrototypeComments } from "@org/prototype-comments";

initPrototypeComments({
  accentColor: "#0066ff",
});
```

### With a backend (multi-reviewer)

```html
<script src="https://your-cdn/prototype-comments.global.js"></script>
<script>
  PrototypeComments.initPrototypeComments({
    store: PrototypeComments.createHttpStore({
      endpoint: "https://comments.example.com",
      projectId: "demo",
      projectKey: "sk_test_123",
    }),
  });
</script>
```

See [@org/comments-server](../comments-server/README.md) for setting up the server.

## Configuration

```ts
initPrototypeComments({
  // Where the FAB renders. Default "bottom-right".
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left",

  // CSS color for highlights, pins, focus rings. Default "#02527E".
  accentColor?: string,

  // Storage backend. Defaults to a localStorage adapter scoped to the current origin.
  store?: CommentStore,

  // Pre-set the reviewer's identity to skip the modal.
  // If absent, the widget prompts once on first comment and persists in localStorage.
  identity?: { name: string; email: string },

  // Override the URL key used for scoping comments. Default: () => location.pathname.
  // Useful for SPAs that want to scope per logical route.
  pageKey?: () => string,

  // Fired after a comment is successfully created.
  onCreate?: (comment: Comment) => void,
});
```

`initPrototypeComments` returns an instance with imperative controls:

```ts
const instance = initPrototypeComments({ … });

instance.start();    // enter selection mode programmatically
instance.stop();     // cancel selection / close composer
instance.destroy();  // remove the widget entirely
```

## Storage adapters

### `createLocalStorageStore`

The default. Single user, single browser. Cross-tab sync via the native `storage` event.

```ts
import { createLocalStorageStore } from "@org/prototype-comments";

const store = createLocalStorageStore({
  key: "__my_comments__", // optional; default "__prototype_comments__"
});
```

### `createHttpStore`

Talks to `@org/comments-server`.

```ts
import { createHttpStore } from "@org/prototype-comments";

const store = createHttpStore({
  endpoint: "https://comments.example.com", // no trailing slash
  projectId: "demo",
  projectKey: "sk_test_123",
  pollMs: 5000, // optional; 0 to disable
});
```

The HTTP adapter polls every `pollMs` and only fires `onChange` when the set of comment IDs actually changes — cheap on the server, near-realtime for the user.

### Bring your own

Anything that satisfies four methods works:

```ts
interface CommentStore {
  list(url: string): Promise<Comment[]>;
  create(input: CommentInput): Promise<Comment>;
  remove(id: string): Promise<void>;
  onChange(listener: () => void): Unsubscribe;
}
```

A Supabase adapter is ~60 lines. A Worker + KV adapter is similar.

## How comments are anchored

The widget remembers each comment by six things about the element you clicked: a CSS selector (via `@medv/finder`), an XPath, the element's tag and id, a 120-char text snippet, a structural fingerprint, and the surrounding text. On reload it tries each strategy in turn — id, CSS selector, XPath, then a confidence-scored smart-scan — until something matches. If everything fails, the pin still renders at the original document coordinates.

This means you can refactor the prototype's CSS or rearrange its DOM and your reviewer's pin still tends to land on the right thing. See [/docs/architecture.md](../../docs/architecture.md#anchoring--five-strategies-one-contract) for the full strategy.

## Running the demo

```bash
pnpm --filter @org/prototype-comments build
cd packages/prototype-comments
python3 -m http.server 8765
# open http://127.0.0.1:8765/demo/index.html
# or with the HTTP backend: ?store=http (also boot @org/comments-server first)
```

## Development

```bash
pnpm --filter @org/prototype-comments dev      # tsup --watch
pnpm nx typecheck @org/prototype-comments      # strict TS check
```

The package has no test suite yet. Tested by running the demo and walking through:

- hover-element selection
- multi-pin pages (same URL)
- scroll while a bubble is open (bubble tracks)
- reload (pins reappear at the right elements)
- prototype with a fixed/sticky element (pins render correctly)
- prototype that gets edited between sessions (smart-scan recovers most cases)

## Public API surface

All exports from `index.ts`:

| Export | Kind |
|---|---|
| `initPrototypeComments(config)` | function — main entry |
| `createLocalStorageStore(options?)` | function — default adapter |
| `createHttpStore(config)` | function — HTTP adapter |
| `Comment`, `CommentInput`, `CommentStore`, `Identity` | types |
| `PrototypeCommentsConfig`, `PrototypeCommentsInstance`, `HttpStoreConfig` | types |
