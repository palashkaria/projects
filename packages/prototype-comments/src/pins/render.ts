import type { Comment, CommentStore } from "../types.js";
import { resolveAnchor } from "../anchoring/index.js";
import { computePinPosition, type PinPosition } from "./math.js";

const PIN_LAYER_CLASS = "pc-pin-layer";

export type PinLayer = {
  refresh(): Promise<void>;
  destroy(): void;
};

export function mountPinLayer(
  shadow: ShadowRoot,
  store: CommentStore,
  options: {
    pageKey: () => string;
    onRemove(id: string): void;
  },
): PinLayer {
  const layer = document.createElement("div");
  layer.className = PIN_LAYER_CLASS;
  layer.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;";
  shadow.appendChild(layer);

  let nodes: Array<{ comment: Comment; el: HTMLElement; resolved: Element | null }> = [];
  let bubble: HTMLElement | null = null;

  const renderPins = (comments: Comment[]) => {
    for (const node of nodes) node.el.remove();
    nodes = [];

    comments.forEach((comment, index) => {
      const resolved = resolveAnchor(comment.anchor);
      const el = document.createElement("button");
      el.type = "button";
      el.className = "pc-pin";
      el.textContent = String(index + 1);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openBubble(comment, el);
      });
      layer.appendChild(el);
      nodes.push({ comment, el, resolved: resolved?.element ?? null });
    });

    reposition();
  };

  const reposition = () => {
    for (const node of nodes) {
      const target = node.resolved;
      const pos: PinPosition | null = target
        ? computePinPosition(target, node.comment.pin, node.comment.placement)
        : null;
      node.el.style.position = "fixed";
      if (!pos) {
        // Fallback: stored document coords minus current scroll → viewport.
        node.el.style.top = `${node.comment.fallbackDocY - window.scrollY}px`;
        node.el.style.left = `${node.comment.fallbackDocX - window.scrollX}px`;
        continue;
      }
      node.el.style.top = `${pos.top}px`;
      node.el.style.left = `${pos.left}px`;
    }
  };

  const openBubble = (comment: Comment, pinEl: HTMLElement) => {
    closeBubble();
    bubble = document.createElement("div");
    bubble.className = "pc-pin-bubble";

    const body = document.createElement("div");
    body.textContent = comment.body;

    const meta = document.createElement("div");
    meta.className = "pc-pin-bubble-meta";
    const date = new Date(comment.createdAt).toLocaleString();
    meta.textContent = comment.author ? `${comment.author.name} · ${date}` : date;

    const actions = document.createElement("div");
    actions.className = "pc-pin-bubble-actions";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "pc-btn";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      options.onRemove(comment.id);
      closeBubble();
    });
    actions.appendChild(remove);

    bubble.append(body, meta, actions);
    shadow.appendChild(bubble);

    const rect = pinEl.getBoundingClientRect();
    bubble.style.top = `${rect.bottom + 8}px`;
    bubble.style.left = `${Math.max(8, rect.left - 120)}px`;

    setTimeout(() => {
      document.addEventListener("mousedown", closeBubbleOnOutside, { capture: true, once: true });
    }, 0);
  };

  const closeBubble = () => {
    if (bubble) {
      bubble.remove();
      bubble = null;
    }
  };

  const closeBubbleOnOutside = (e: MouseEvent) => {
    if (bubble && e.target instanceof Node && !bubble.contains(e.target)) {
      closeBubble();
    }
  };

  const handleResize = () => reposition();
  const handleScroll = () => reposition();
  window.addEventListener("resize", handleResize);
  window.addEventListener("scroll", handleScroll, { passive: true });
  // ResizeObserver picks up layout shifts (images loading, etc).
  const ro = new ResizeObserver(() => reposition());
  ro.observe(document.body);

  const refresh = async () => {
    const comments = await store.list(options.pageKey());
    renderPins(comments);
  };

  return {
    refresh,
    destroy() {
      closeBubble();
      for (const node of nodes) node.el.remove();
      layer.remove();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      ro.disconnect();
    },
  };
}
