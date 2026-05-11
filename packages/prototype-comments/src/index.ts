import { generateAnchor } from "./anchoring/index.js";
import { openComposer } from "./composer/composer.js";
import { mountWidgetHost } from "./isolation/host.js";
import { detectPlacement, normalisePinAnchor } from "./pins/math.js";
import { mountPinLayer } from "./pins/render.js";
import { startSelection } from "./selection/overlay.js";
import { createLocalStorageStore } from "./storage/index.js";
import { mountFab } from "./ui/fab.js";
import type {
  CommentInput,
  PrototypeCommentsConfig,
  PrototypeCommentsInstance,
} from "./types.js";

export type { Comment, CommentInput, CommentStore, PrototypeCommentsConfig, PrototypeCommentsInstance } from "./types.js";
export { createLocalStorageStore } from "./storage/index.js";

const AUTHOR_KEY = "__prototype_comments_author__";

export function initPrototypeComments(
  config: PrototypeCommentsConfig = {},
): PrototypeCommentsInstance {
  const accent = config.accentColor ?? "#02527E";
  const position = config.position ?? "bottom-right";
  const store = config.store ?? createLocalStorageStore();
  const pageKey = config.pageKey ?? (() => location.pathname);

  const widget = mountWidgetHost(accent);

  type Mode = "idle" | "selecting" | "composing";
  let mode: Mode = "idle";
  let selectionHandle: ReturnType<typeof startSelection> | null = null;
  let composerHandle: ReturnType<typeof openComposer> | null = null;

  const pins = mountPinLayer(widget.shadow, store, {
    pageKey,
    async onRemove(id) {
      await store.remove(id);
      await pins.refresh();
    },
  });

  const fab = mountFab(widget.shadow, position, () => {
    if (mode === "idle") setMode("selecting");
    else setMode("idle");
  });

  const setMode = (next: Mode) => {
    if (mode === next) return;
    mode = next;

    selectionHandle?.stop();
    selectionHandle = null;
    composerHandle?.close();
    composerHandle = null;

    fab.setActive(next !== "idle");

    if (next === "selecting") {
      selectionHandle = startSelection(widget.shadow, {
        onSelect: ({ element, clientX, clientY }) => beginComposing(element, clientX, clientY),
        onCancel: () => setMode("idle"),
      });
    }
  };

  const beginComposing = (element: Element, clientX: number, clientY: number) => {
    selectionHandle?.stop();
    selectionHandle = null;
    mode = "composing";

    const anchor = generateAnchor(element);
    const pin = normalisePinAnchor(element, clientX, clientY);
    const placement = detectPlacement(element);
    const fallbackDocX = clientX + window.scrollX;
    const fallbackDocY = clientY + window.scrollY;

    composerHandle = openComposer(widget.shadow, element, {
      onCancel: () => setMode("idle"),
      async onSubmit({ body }) {
        const authorName = resolveAuthorName(config.authorName);
        const input: CommentInput = {
          body,
          url: pageKey(),
          authorName,
          anchor,
          pin,
          placement,
          fallbackDocX,
          fallbackDocY,
          viewportW: window.innerWidth,
          viewportH: window.innerHeight,
        };
        try {
          const created = await store.create(input);
          config.onCreate?.(created);
          setMode("idle");
          await pins.refresh();
        } catch (err) {
          console.error("[prototype-comments] failed to save comment:", err);
        }
      },
    });
  };

  // Initial render + cross-tab refresh.
  void pins.refresh();
  const unsubscribe = store.onChange(() => {
    void pins.refresh();
  });

  return {
    start: () => setMode("selecting"),
    stop: () => setMode("idle"),
    destroy() {
      setMode("idle");
      unsubscribe();
      pins.destroy();
      fab.destroy();
      widget.destroy();
    },
  };
}

function resolveAuthorName(provided?: string): string | undefined {
  if (provided) return provided;
  try {
    const stored = localStorage.getItem(AUTHOR_KEY);
    if (stored) return stored;
    const entered = window.prompt("Your name (so others can see who left this comment):");
    if (entered) {
      localStorage.setItem(AUTHOR_KEY, entered);
      return entered;
    }
  } catch {
    // Ignore localStorage failures (private browsing, etc.)
  }
  return undefined;
}
