import {
  groupByWorkspace,
  symbols,
  type ActivitySnapshot,
} from '@org/herdr-activity/model';
/** Untrusted titles must never become terminal control sequences. */
export function plain(value: string): string {
  return value.replace(/[\x00-\x1f\x7f-\x9f]/g, ' ').slice(0, 160);
}
export function render(snapshot: ActivitySnapshot, now = Date.now()): string {
  const success = snapshot.connection.lastSuccessAt;
  const lines = [
    'Herdr Activity',
    `${snapshot.connection.state.toUpperCase()}${
      snapshot.connection.state !== 'connected'
        ? ' — retained data may be stale'
        : ''
    }`,
    `Last refresh: ${
      success === null
        ? 'never'
        : `${Math.max(0, Math.floor((now - success) / 1000))}s ago`
    } | ${snapshot.panes.length} panes | ${
      snapshot.workspaces.length
    } workspaces`,
  ];
  if (snapshot.connection.error) lines.push(plain(snapshot.connection.error));
  for (const group of groupByWorkspace(snapshot)) {
    lines.push('', plain(group.name));
    if (!group.panes.length) lines.push('  (empty workspace)');
    for (const pane of group.panes) {
      const attention =
        pane.attention && snapshot.connection.state === 'connected'
          ? ' ◇ turn ended (inferred)'
          : '';
      const recent =
        pane.lastActivityAt === null
          ? 'activity unknown'
          : `${Math.max(
              0,
              Math.floor((now - pane.lastActivityAt) / 1000)
            )}s since observed activity`;
      lines.push(
        `  ${symbols[pane.rawStatus]} ${plain(pane.title)} [${
          pane.rawStatus
        }]${attention}`
      );
      lines.push(
        `    ${plain(pane.agent ?? 'shell')} · ${plain(pane.id)} · ${recent}`
      );
    }
  }
  if (!snapshot.panes.length && !snapshot.workspaces.length)
    lines.push(
      '',
      snapshot.connection.state === 'connected'
        ? 'No live panes or workspaces.'
        : 'Waiting for a successful snapshot.'
    );
  lines.push(
    '',
    '▶ working  ? blocked  · idle  ~ unknown  ◇ turn ended ≠ task success',
    'q / Esc to close. ↑/↓ to scroll.'
  );
  return lines.join('\n');
}
