/** Browser-safe v1 wire contract. All times are epoch milliseconds. */
export type RawStatus = 'working' | 'blocked' | 'idle' | 'unknown';
export interface ActivityPane {
  id: string;
  workspaceId: string | null;
  title: string;
  cwd: string | null;
  agent: string | null;
  sessionId: string | null;
  rawStatus: RawStatus;
  reportedStatus: string | null;
  attention: 'turn-ended' | null;
  lastActivityAt: number | null;
}
export interface ActivityWorkspace {
  id: string;
  name: string;
}
export interface ActivitySnapshot {
  version: 1;
  revision: number;
  endpoint: string;
  connection: {
    state: 'connecting' | 'connected' | 'disconnected';
    lastSuccessAt: number | null;
    error: string | null;
  };
  workspaces: ActivityWorkspace[];
  panes: ActivityPane[];
}
export const symbols: Record<RawStatus | 'turn-ended', string> = {
  working: '▶',
  blocked: '?',
  idle: '·',
  unknown: '~',
  'turn-ended': '◇',
};
export function groupByWorkspace(snapshot: ActivitySnapshot) {
  const groups = new Map<
    string | null,
    { id: string | null; name: string; panes: ActivityPane[] }
  >();
  for (const workspace of snapshot.workspaces)
    groups.set(workspace.id, { ...workspace, panes: [] });
  for (const pane of snapshot.panes) {
    if (!groups.has(pane.workspaceId))
      groups.set(pane.workspaceId, {
        id: pane.workspaceId,
        name: pane.workspaceId ?? 'No workspace',
        panes: [],
      });
    groups.get(pane.workspaceId)!.panes.push(pane);
  }
  for (const group of groups.values())
    group.panes.sort(
      (a, b) =>
        (b.lastActivityAt ?? -1) - (a.lastActivityAt ?? -1) ||
        a.title.localeCompare(b.title) ||
        a.id.localeCompare(b.id)
    );
  return [...groups.values()];
}

/** Validate an untrusted v1 HTTP payload before displaying it. */
export function parseActivitySnapshot(value: unknown): ActivitySnapshot {
  const object = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === 'object' && !Array.isArray(v);
  const nullableText = (v: unknown) => v === null || typeof v === 'string';
  const timestamp = (v: unknown) =>
    v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0);
  if (
    !object(value) ||
    value.version !== 1 ||
    !Number.isSafeInteger(value.revision) ||
    typeof value.endpoint !== 'string' ||
    !object(value.connection) ||
    !['connecting', 'connected', 'disconnected'].includes(
      String(value.connection.state)
    ) ||
    !timestamp(value.connection.lastSuccessAt) ||
    !nullableText(value.connection.error) ||
    !Array.isArray(value.workspaces) ||
    !value.workspaces.every(
      (w) => object(w) && typeof w.id === 'string' && typeof w.name === 'string'
    ) ||
    !Array.isArray(value.panes) ||
    !value.panes.every(
      (p) =>
        object(p) &&
        typeof p.id === 'string' &&
        typeof p.title === 'string' &&
        nullableText(p.workspaceId) &&
        nullableText(p.cwd) &&
        nullableText(p.agent) &&
        nullableText(p.sessionId) &&
        nullableText(p.reportedStatus) &&
        ['working', 'blocked', 'idle', 'unknown'].includes(
          String(p.rawStatus)
        ) &&
        (p.attention === null || p.attention === 'turn-ended') &&
        timestamp(p.lastActivityAt)
    )
  )
    throw new Error('Unsupported activity snapshot');
  return value as unknown as ActivitySnapshot;
}
