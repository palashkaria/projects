export const WIDGET_HOST_TAG = "prototype-comments-root";
export const WIDGET_DATA_ATTR = "data-prototype-comments";
export const Z_INDEX_OVERLAY = 2147483600;
export const Z_INDEX_PIN = 2147483645;
export const Z_INDEX_HOST = 2147483647;

export type WidgetHost = {
  host: HTMLElement;
  shadow: ShadowRoot;
  destroy(): void;
};

/**
 * Mounts a fixed host element with a closed Shadow DOM into document.body.
 * The host itself is positioned fixed at top:0/left:0; the shadow content
 * uses its own absolute/fixed positioning relative to the viewport.
 */
export function mountWidgetHost(accentColor: string): WidgetHost {
  const host = document.createElement(WIDGET_HOST_TAG);
  host.setAttribute(WIDGET_DATA_ATTR, "");
  host.style.cssText = `position:fixed;top:0;left:0;width:0;height:0;z-index:${Z_INDEX_HOST};pointer-events:none;`;

  const shadow = host.attachShadow({ mode: "closed" });
  injectStyles(shadow, accentColor);

  document.body.appendChild(host);

  return {
    host,
    shadow,
    destroy() {
      host.remove();
    },
  };
}

function injectStyles(shadow: ShadowRoot, accent: string) {
  const css = buildStyles(accent);
  const supportsAdopted = "adoptedStyleSheets" in ShadowRoot.prototype;
  if (supportsAdopted) {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      (shadow as ShadowRoot & { adoptedStyleSheets: CSSStyleSheet[] }).adoptedStyleSheets = [sheet];
      return;
    } catch {
      // Fall through to <style> fallback (Safari <16.4)
    }
  }
  const style = document.createElement("style");
  style.textContent = css;
  shadow.appendChild(style);
}

function buildStyles(accent: string): string {
  return `
:host { all: initial; }
* { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

.pc-fab {
  position: fixed;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: ${accent};
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.pc-fab:hover { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
.pc-fab.is-active { background: #b91c1c; }
.pc-fab svg { width: 20px; height: 20px; }

.pc-highlight {
  position: fixed;
  border: 2px solid ${accent};
  background: ${accent}1a;
  border-radius: 4px;
  pointer-events: none;
  transition: top 80ms ease, left 80ms ease, width 80ms ease, height 80ms ease;
}

.pc-banner {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: ${accent};
  color: white;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.pc-composer {
  position: fixed;
  width: 280px;
  background: white;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 12px;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pc-composer textarea {
  width: 100%;
  min-height: 60px;
  max-height: 160px;
  resize: vertical;
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
}
.pc-composer textarea:focus { border-color: ${accent}; box-shadow: 0 0 0 3px ${accent}33; }
.pc-composer-actions { display: flex; gap: 6px; justify-content: flex-end; align-items: center; }
.pc-composer-hint { flex: 1; color: rgba(0,0,0,0.5); font-size: 11px; }
.pc-btn {
  border: 1px solid rgba(0,0,0,0.1);
  background: white;
  color: rgba(0,0,0,0.7);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.pc-btn:hover { background: rgba(0,0,0,0.04); }
.pc-btn.is-primary { background: ${accent}; color: white; border-color: ${accent}; }
.pc-btn.is-primary:hover { filter: brightness(0.95); }
.pc-btn[disabled] { opacity: 0.5; cursor: not-allowed; }

.pc-pin {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: ${accent};
  color: white;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transform: translate(-50%, -50%);
}

.pc-pin-bubble {
  position: fixed;
  width: 260px;
  background: white;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 10px 12px;
  pointer-events: auto;
  font-size: 13px;
  color: rgba(0,0,0,0.85);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pc-pin-bubble-meta { font-size: 11px; color: rgba(0,0,0,0.5); }
.pc-pin-bubble-actions { display: flex; gap: 6px; justify-content: flex-end; margin-top: 4px; }
`;
}
