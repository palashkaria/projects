import type { Anchor } from "../types.js";
import { scoreFingerprint } from "./fingerprint.js";

const SMART_SCAN_CAP = 300;
const MIN_CONFIDENCE = 0.55;

export type Resolution = {
  element: Element;
  confidence: number;
  strategy: "id" | "css" | "xpath" | "smart-scan";
};

export function resolveAnchor(anchor: Anchor): Resolution | null {
  if (anchor.elementId) {
    const el = document.getElementById(anchor.elementId);
    if (el && el.tagName === anchor.elementTag && textMatches(el, anchor)) {
      return { element: el, confidence: 1.0, strategy: "id" };
    }
  }

  try {
    const el = document.querySelector(anchor.cssSelector);
    if (el && el.tagName === anchor.elementTag && textMatches(el, anchor)) {
      return { element: el, confidence: 0.95, strategy: "css" };
    }
  } catch {
    // Invalid selector after DOM changes — fall through.
  }

  try {
    const result = document.evaluate(
      anchor.xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    );
    const node = result.singleNodeValue;
    if (node instanceof Element && node.tagName === anchor.elementTag && textMatches(node, anchor)) {
      return { element: node, confidence: 0.9, strategy: "xpath" };
    }
  } catch {
    // Invalid xpath after DOM changes — fall through.
  }

  return smartScan(anchor);
}

function smartScan(anchor: Anchor): Resolution | null {
  const candidates = Array.from(document.getElementsByTagName(anchor.elementTag)).slice(
    0,
    SMART_SCAN_CAP,
  );
  let best: { el: Element; score: number } | null = null;

  for (const el of candidates) {
    const score = scoreCandidate(el, anchor);
    if (!best || score > best.score) {
      best = { el, score };
    }
  }

  if (!best || best.score < MIN_CONFIDENCE) return null;
  return { element: best.el, confidence: best.score * 0.85, strategy: "smart-scan" };
}

function scoreCandidate(candidate: Element, anchor: Anchor): number {
  let score = 0;
  let total = 0;

  if (anchor.textSnippet) {
    total += 50;
    const text = (candidate.textContent ?? "").trim();
    if (text === anchor.textSnippet) score += 50;
    else if (text.includes(anchor.textSnippet)) score += 35;
    else if (anchor.textSnippet.includes(text) && text.length > 8) score += 20;
  }

  if (anchor.fingerprint) {
    total += 30;
    score += scoreFingerprint(candidate, anchor.fingerprint) * 30;
  }

  if (anchor.neighborText) {
    total += 20;
    const parent = candidate.parentElement;
    if (parent) {
      const neighbor = (parent.textContent ?? "")
        .replace((candidate.textContent ?? "").trim(), "")
        .trim();
      if (neighbor.includes(anchor.neighborText)) score += 20;
      else if (anchor.neighborText.includes(neighbor) && neighbor.length > 6) score += 10;
    }
  }

  return total === 0 ? 0 : score / total;
}

function textMatches(candidate: Element, anchor: Anchor): boolean {
  if (!anchor.textSnippet) return true;
  const text = (candidate.textContent ?? "").trim();
  if (!text) return anchor.textSnippet.length === 0;
  if (text === anchor.textSnippet) return true;
  if (text.includes(anchor.textSnippet)) return true;
  if (anchor.textSnippet.includes(text) && text.length > 8) return true;
  return false;
}
