import { finder } from "@medv/finder";
import type { Anchor } from "../types.js";
import { generateXPath } from "./xpath.js";
import { generateFingerprint } from "./fingerprint.js";

const TEXT_SNIPPET_LEN = 120;
const NEIGHBOR_TEXT_LEN = 80;

const FRAMEWORK_HASH_CLASS = /^(css|sc|emotion|styled)-/;
const SHORT_HASH_CLASS = /^[a-z]{1,3}[A-Za-z0-9]{4,8}$/;
const RADIX_ID = /^radix-/;
const REACT_GENERATED_ID = /^:r[0-9]+:$/;

const SEMANTIC_ATTRS = new Set(["data-testid", "data-id", "data-component", "role", "aria-label"]);

export function generateAnchor(element: Element): Anchor {
  const cssSelector = finder(element, {
    className: (name) => !FRAMEWORK_HASH_CLASS.test(name) && !SHORT_HASH_CLASS.test(name),
    attr: (name) => SEMANTIC_ATTRS.has(name),
    idName: (name) => !RADIX_ID.test(name) && !REACT_GENERATED_ID.test(name),
  });

  return {
    cssSelector,
    xpath: generateXPath(element),
    elementTag: element.tagName,
    elementId: element.id || undefined,
    textSnippet: (element.textContent ?? "").trim().slice(0, TEXT_SNIPPET_LEN),
    fingerprint: generateFingerprint(element),
    neighborText: neighborText(element),
  };
}

function neighborText(element: Element): string {
  const parent = element.parentElement;
  if (!parent) return "";
  return (parent.textContent ?? "")
    .replace((element.textContent ?? "").trim(), "")
    .trim()
    .slice(0, NEIGHBOR_TEXT_LEN);
}
