// Boundary to herdr-activity-contract.md v1. No dependency on coordinator or transport internals.
export function parseSnapshot(value) {
  if (
    value?.version !== 1 ||
    !Number.isFinite(value.revision) ||
    typeof value.endpoint !== 'string' ||
    !(
      value.connection?.lastSuccessAt === null ||
      Number.isFinite(value.connection?.lastSuccessAt)
    ) ||
    !Array.isArray(value.panes) ||
    !Array.isArray(value.workspaces) ||
    !['connected', 'connecting', 'disconnected'].includes(
      value.connection?.state
    )
  )
    throw new Error('Unsupported activity snapshot (expected v1).');
  for (const w of value.workspaces)
    if (typeof w.id !== 'string' || typeof w.name !== 'string')
      throw new Error('Invalid workspace');
  for (const p of value.panes)
    if (
      typeof p.id !== 'string' ||
      typeof p.title !== 'string' ||
      ![p.workspaceId, p.cwd, p.agent, p.sessionId, p.reportedStatus].every(
        (v) => v === null || typeof v === 'string'
      ) ||
      !(p.lastActivityAt === null || Number.isFinite(p.lastActivityAt)) ||
      !['working', 'blocked', 'idle', 'unknown'].includes(p.rawStatus) ||
      ![null, 'turn-ended'].includes(p.attention)
    )
      throw new Error('Invalid pane');
  return value;
}
export function connectActivity(onSnapshot, onError) {
  const controller = new AbortController();
  let stream;
  let latest = null;
  const receive = (data) => {
    const snapshot = parseSnapshot(data);
    // Revisions restart with the observer; SSE delivery order is authoritative.
    latest = snapshot;
    onSnapshot(snapshot);
  };
  fetch('/api/v1/snapshot', { signal: controller.signal, cache: 'no-store' })
    .then((r) => {
      if (!r.ok) throw new Error('Shared activity server unavailable');
      return r.json();
    })
    .then((data) => {
      // A later-arriving initial GET must not replace a newer SSE snapshot.
      if (!latest) receive(data);
    })
    .catch((e) => {
      if (e.name !== 'AbortError' && !latest) onError(e.message);
    });
  stream = new EventSource('/api/v1/events');
  stream.addEventListener('snapshot', (event) => {
    try {
      receive(JSON.parse(event.data));
    } catch (e) {
      onError(e.message);
    }
  });
  stream.onerror = () =>
    onError(
      'Read-only feed disconnected. Last received inventory is retained; reconnecting.'
    );
  return () => {
    controller.abort();
    stream.close();
  };
}
