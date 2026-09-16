import type {
  ActivityPane,
  ActivitySnapshot,
  ActivityWorkspace,
  RawStatus,
} from './model.js';
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object');
  return value as Record<string, unknown>;
}
function text(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
function id(value: unknown): string {
  const result = text(value);
  if (!result) throw new Error('Missing inventory ID');
  return result;
}
export function normalizeInventory(
  agents: unknown[],
  panes: unknown[],
  workspaces: unknown[]
) {
  const rows = new Map<string, Record<string, unknown>>();
  for (const value of panes) {
    const row = record(value);
    rows.set(id(row.pane_id), row);
  }
  for (const value of agents) {
    const row = record(value);
    const key = id(row.pane_id);
    rows.set(key, { ...rows.get(key), ...row });
  }
  const normalizedPanes: ActivityPane[] = [...rows.entries()].map(
    ([key, row]) => {
      const reportedStatus = text(row.agent_status);
      const rawStatus: RawStatus =
        reportedStatus === 'working' ||
        reportedStatus === 'blocked' ||
        reportedStatus === 'idle'
          ? reportedStatus
          : 'unknown';
      return {
        id: key,
        workspaceId: text(row.workspace_id),
        title:
          text(row.terminal_title_stripped) ??
          text(row.title) ??
          text(row.terminal_title) ??
          text(row.name) ??
          key,
        cwd: text(row.foreground_cwd) ?? text(row.cwd),
        agent: text(row.agent),
        sessionId: row.agent_session
          ? text(record(row.agent_session).value)
          : null,
        rawStatus,
        reportedStatus,
        attention: null,
        lastActivityAt: null,
      };
    }
  );
  const normalizedWorkspaces: ActivityWorkspace[] = workspaces.map((value) => {
    const row = record(value);
    const key = id(row.workspace_id);
    return { id: key, name: text(row.label) ?? key };
  });
  return { panes: normalizedPanes, workspaces: normalizedWorkspaces };
}
/** Inferences only span successful, consecutive observations of the same attachment. */
export function reduceActivity(
  previous: ActivitySnapshot,
  inventory: ReturnType<typeof normalizeInventory>,
  now: number,
  holdMs: number
): ActivitySnapshot {
  const old = new Map(previous.panes.map((pane) => [pane.id, pane]));
  const contiguous = previous.connection.state === 'connected';
  return {
    version: 1,
    revision: previous.revision + 1,
    endpoint: previous.endpoint,
    connection: { state: 'connected', lastSuccessAt: now, error: null },
    workspaces: inventory.workspaces,
    panes: inventory.panes.map((pane) => {
      const before = old.get(pane.id);
      const same =
        before &&
        before.agent === pane.agent &&
        before.sessionId === pane.sessionId;
      const changed = same && contiguous && before.rawStatus !== pane.rawStatus;
      const ended =
        changed &&
        before.rawStatus === 'working' &&
        pane.rawStatus === 'idle' &&
        !!pane.agent;
      const lastActivityAt =
        pane.rawStatus === 'working' || changed
          ? now
          : same
          ? before.lastActivityAt
          : null;
      const held =
        same &&
        contiguous &&
        before.attention === 'turn-ended' &&
        pane.rawStatus === 'idle';
      return {
        ...pane,
        lastActivityAt,
        attention:
          (ended || held) &&
          lastActivityAt !== null &&
          now - lastActivityAt < holdMs
            ? 'turn-ended'
            : null,
      };
    }),
  };
}
