import type { Placement, PinAnchor } from "../types.js";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Convert viewport click coords to a 0–1 anchor within an element. Returns
 * (0.5, 0.5) — the centre — if the element has no measurable area.
 */
export function normalisePinAnchor(
  element: Element,
  clientX: number,
  clientY: number,
): PinAnchor {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return { x: 0.5, y: 0.5 };
  return {
    x: clamp((clientX - rect.left) / rect.width, 0, 1),
    y: clamp((clientY - rect.top) / rect.height, 0, 1),
  };
}

/**
 * Detect whether an element (or any ancestor) is positioned fixed/sticky. Pins
 * for such elements travel with the viewport, not the document, so we render
 * them as `position: fixed` instead of `position: absolute`.
 */
export function detectPlacement(element: Element): Placement {
  let current: Element | null = element;
  while (current && current !== document.body) {
    const position = window.getComputedStyle(current).position;
    if (position === "fixed" || position === "sticky") return "viewport";
    current = current.parentElement;
  }
  return "document";
}

export type PinPosition = { top: number; left: number };

/**
 * Compute the pin position in viewport coordinates. Pins are rendered with
 * `position: fixed` inside the widget host, so the caller can pass these
 * straight to `style.top/left`. Returns null when the element has no measurable
 * area (e.g. inside a hidden dialog) so the pin can be hidden.
 *
 * The `placement` field on the comment is captured for future use (e.g. server
 * routing rules) but isn't needed here — recomputing on every scroll/resize
 * with viewport coords handles fixed, sticky, and normal-flow uniformly.
 */
export function computePinPosition(
  element: Element,
  pin: PinAnchor,
  _placement: Placement,
): PinPosition | null {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;

  return {
    top: rect.top + rect.height * pin.y,
    left: rect.left + rect.width * pin.x,
  };
}
