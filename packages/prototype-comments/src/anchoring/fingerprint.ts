/**
 * Structural fingerprint that ignores visual styling. Used to score candidates
 * during smart-scan when CSS/XPath selectors fail.
 *
 * Format: `${tag}:${childCount}:${siblingIndex}:${attrHash}`
 */
export function generateFingerprint(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const childCount = element.children.length;
  const parent = element.parentElement;
  const siblingIndex = parent ? Array.from(parent.children).indexOf(element) : 0;
  const attrHash = hashAttributes(element);
  return `${tag}:${childCount}:${siblingIndex}:${attrHash}`;
}

export function scoreFingerprint(candidate: Element, fingerprint: string): number {
  const parts = fingerprint.split(":");
  if (parts.length !== 4) return 0;
  const [tag, childCount, siblingIndex, attrHash] = parts;
  const candidateParts = generateFingerprint(candidate).split(":");
  let matches = 0;
  if (candidateParts[0] === tag) matches += 0.4;
  if (candidateParts[1] === childCount) matches += 0.2;
  if (candidateParts[2] === siblingIndex) matches += 0.2;
  if (candidateParts[3] === attrHash) matches += 0.2;
  return matches;
}

function hashAttributes(element: Element): string {
  const interesting = ["role", "aria-label", "data-testid", "data-id", "type", "name"];
  const values = interesting
    .map((name) => element.getAttribute(name))
    .filter((v): v is string => v != null)
    .join("|");
  if (!values) return "0";
  let hash = 0;
  for (let i = 0; i < values.length; i += 1) {
    hash = (hash << 5) - hash + values.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}
