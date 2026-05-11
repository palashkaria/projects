type FabPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const POSITION_CSS: Record<FabPosition, string> = {
  "bottom-right": "bottom:24px;right:24px;",
  "bottom-left": "bottom:24px;left:24px;",
  "top-right": "top:24px;right:24px;",
  "top-left": "top:24px;left:24px;",
};

const CHAT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

export type FabHandle = {
  setActive(active: boolean): void;
  destroy(): void;
};

export function mountFab(
  shadow: ShadowRoot,
  position: FabPosition,
  onClick: () => void,
): FabHandle {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pc-fab";
  button.setAttribute("aria-label", "Leave a comment");
  button.style.cssText = POSITION_CSS[position];
  button.innerHTML = CHAT_ICON;
  button.addEventListener("click", onClick);
  shadow.appendChild(button);

  return {
    setActive(active: boolean) {
      button.classList.toggle("is-active", active);
      button.innerHTML = active ? CLOSE_ICON : CHAT_ICON;
      button.setAttribute("aria-label", active ? "Cancel" : "Leave a comment");
    },
    destroy() {
      button.remove();
    },
  };
}
