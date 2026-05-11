const MAX_DEPTH = 6;

export function generateXPath(element: Element): string {
  if (element.id) return `//${element.tagName.toLowerCase()}[@id='${escapeXpath(element.id)}']`;

  const segments: string[] = [];
  let current: Element | null = element;
  let depth = 0;

  while (current && depth < MAX_DEPTH) {
    if (current.nodeType !== 1) break;
    const node: Element = current;
    const tag = node.tagName.toLowerCase();
    if (tag === "html" || tag === "body") {
      segments.unshift(tag);
      break;
    }
    const parent = node.parentElement;
    if (!parent) {
      segments.unshift(tag);
      break;
    }
    const siblings = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
    if (siblings.length === 1) {
      segments.unshift(tag);
    } else {
      const index = siblings.indexOf(node) + 1;
      segments.unshift(`${tag}[${index}]`);
    }
    current = parent;
    depth += 1;
  }

  return "/" + segments.join("/");
}

function escapeXpath(value: string): string {
  return value.replace(/'/g, "\\'");
}
