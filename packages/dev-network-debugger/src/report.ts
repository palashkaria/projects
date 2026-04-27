import type { DebuggerStore } from "./interceptor";

export function formatReport(store: DebuggerStore): string {
  const lines: string[] = [];
  const now = new Date();
  const date = now.toISOString().split("T")[0];

  lines.push(`## Network Resilience Test — ${date}`);
  lines.push("");

  // Collect endpoints that have notes or are blocked
  const reported = new Set<string>();

  for (const [key, note] of store.notes) {
    if (!note) continue;
    reported.add(key);
    const blocked = store.blocklist.get(key) ?? false;
    const status = blocked ? "BLOCKED" : "allowed";
    lines.push(`- \`${key}\` — ${status} -> ${note}`);
  }

  // Also include blocked endpoints without notes
  for (const [key, isBlocked] of store.blocklist) {
    if (!isBlocked || reported.has(key)) continue;
    lines.push(`- \`${key}\` — BLOCKED -> (no observation recorded)`);
  }

  if (reported.size === 0 && !hasBlockedEntries(store)) {
    lines.push("No endpoints tested yet.");
  }

  lines.push("");
  return lines.join("\n");
}

function hasBlockedEntries(store: DebuggerStore): boolean {
  for (const v of store.blocklist.values()) {
    if (v) return true;
  }
  return false;
}
