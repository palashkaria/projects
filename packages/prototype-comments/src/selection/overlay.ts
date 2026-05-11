import { WIDGET_DATA_ATTR, Z_INDEX_OVERLAY } from "../isolation/host.js";

export type SelectionResult = {
  element: Element;
  clientX: number;
  clientY: number;
};

export type SelectionHandle = {
  /** Tear down listeners + DOM. Safe to call multiple times. */
  stop(): void;
};

/**
 * Activates hover-element selection mode. Tracks the element under the cursor
 * with a fixed-position highlight rendered into the given shadow root. Calls
 * `onSelect` when the user clicks; calls `onCancel` on ESC or right-click.
 */
export function startSelection(
  shadow: ShadowRoot,
  options: {
    onSelect(result: SelectionResult): void;
    onCancel(): void;
  },
): SelectionHandle {
  const highlight = document.createElement("div");
  highlight.className = "pc-highlight";
  highlight.style.display = "none";
  shadow.appendChild(highlight);

  const banner = document.createElement("div");
  banner.className = "pc-banner";
  banner.textContent = "Click an element to comment · ESC to cancel";
  shadow.appendChild(banner);

  let currentTarget: Element | null = null;
  const prevCursor = document.body.style.cursor;
  document.body.style.cursor = "crosshair";

  const isWidgetElement = (el: EventTarget | null): boolean => {
    if (!(el instanceof Element)) return false;
    return el.closest(`[${WIDGET_DATA_ATTR}]`) != null;
  };

  const handleMove = (e: MouseEvent) => {
    if (isWidgetElement(e.target)) {
      highlight.style.display = "none";
      currentTarget = null;
      return;
    }
    const target = e.target as Element | null;
    if (!target) return;

    currentTarget = target;
    const rect = target.getBoundingClientRect();
    highlight.style.display = "";
    highlight.style.top = `${rect.top}px`;
    highlight.style.left = `${rect.left}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    highlight.style.zIndex = String(Z_INDEX_OVERLAY);
  };

  const handleClick = (e: MouseEvent) => {
    if (isWidgetElement(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (!currentTarget) return;
    options.onSelect({ element: currentTarget, clientX: e.clientX, clientY: e.clientY });
  };

  // Block host-page clicks during selection so we don't trigger their buttons.
  const blockMouseEvent = (e: MouseEvent) => {
    if (isWidgetElement(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      options.onCancel();
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    options.onCancel();
  };

  document.addEventListener("mousemove", handleMove, true);
  document.addEventListener("click", handleClick, true);
  document.addEventListener("mousedown", blockMouseEvent, true);
  document.addEventListener("pointerdown", blockMouseEvent, true);
  document.addEventListener("keydown", handleKey, true);
  document.addEventListener("contextmenu", handleContextMenu, true);

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      document.removeEventListener("mousemove", handleMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("mousedown", blockMouseEvent, true);
      document.removeEventListener("pointerdown", blockMouseEvent, true);
      document.removeEventListener("keydown", handleKey, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.body.style.cursor = prevCursor;
      highlight.remove();
      banner.remove();
    },
  };
}
