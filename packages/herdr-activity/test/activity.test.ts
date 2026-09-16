import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Socket } from 'node:net';
import { get } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import {
  createObserver,
  createActivityServer,
  groupByWorkspace,
  type ActivitySnapshot,
} from '../src/index.js';
import { normalizeInventory, reduceActivity } from '../src/normalize.js';
import { readList, resolveSocketPath } from '../src/transport.js';

const initial = (): ActivitySnapshot => ({
  version: 1,
  revision: 0,
  endpoint: 'fake',
  connection: { state: 'connecting', lastSuccessAt: null, error: null },
  panes: [],
  workspaces: [],
});
const agent = (status: string, extra = {}) => ({
  pane_id: 'p1',
  workspace_id: 'w1',
  agent: 'codex',
  agent_status: status,
  agent_session: { value: 'same-session' },
  ...extra,
});
const inventory = (status: string) =>
  normalizeInventory(
    [agent(status)],
    [{ pane_id: 'shell', workspace_id: 'w2' }],
    [{ workspace_id: 'w1', label: 'Workspace' }, { workspace_id: 'empty' }]
  );
async function until(predicate: () => boolean) {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (predicate()) return;
    await delay(5);
  }
  assert.fail('Timed out waiting for lifecycle state');
}
async function fake() {
  const directory = await mkdtemp('/tmp/herdr-activity-');
  const path = join(directory, 'api.sock');
  const sockets = new Set<Socket>();
  const calls: string[] = [];
  let status = 'working';
  let mode = 'normal';
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => {});
    let input = '';
    socket.on('data', (chunk) => {
      input += chunk;
      if (!input.includes('\n')) return;
      const request = JSON.parse(input);
      calls.push(request.method);
      if (mode === 'hang') return;
      if (mode === 'close') {
        socket.end('{');
        return;
      }
      if (mode === 'malformed') {
        socket.end('garbage\n');
        return;
      }
      if (mode === 'oversize') {
        socket.end('x'.repeat(4 * 1024 * 1024 + 1));
        return;
      }
      const result =
        request.method === 'agent.list'
          ? { agents: [agent(status)] }
          : request.method === 'pane.list'
          ? { panes: [{ pane_id: 'shell', workspace_id: 'w1' }] }
          : {
              workspaces: [
                { workspace_id: 'w1', label: 'One' },
                { workspace_id: 'empty', label: 'Empty' },
              ],
            };
      const response =
        JSON.stringify({
          id: request.id,
          result: mode === 'bad-shape' ? {} : result,
        }) + '\n';
      socket.write(response.slice(0, 13));
      setTimeout(() => socket.end(response.slice(13)), 2);
    });
  });
  await new Promise<void>((resolve) => server.listen(path, resolve));
  return {
    path,
    calls,
    sockets,
    status(value: string) {
      status = value;
    },
    mode(value: string) {
      mode = value;
    },
    async close() {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await rm(directory, { recursive: true, force: true });
    },
  };
}

test('raw states, unknown done, empty workspaces, shells and duplicate sessions remain truthful', () => {
  const normalized = normalizeInventory(
    [agent('done'), agent('new-state', { pane_id: 'p2' })],
    [{ pane_id: 'shell' }],
    [{ workspace_id: 'empty', label: 'Empty' }]
  );
  assert.equal(normalized.panes.length, 3);
  assert.equal(
    normalized.panes.find((p) => p.id === 'p1')?.reportedStatus,
    'done'
  );
  assert.ok(
    normalized.panes.every(
      (p) => p.rawStatus === 'unknown' && p.lastActivityAt === null
    )
  );
  assert.equal(
    groupByWorkspace(reduceActivity(initial(), normalized, 100, 30))[0].panes
      .length,
    0
  );
  assert.throws(() => normalizeInventory([], [{}], []), /ID/);
});

test('attention is a bounded inference; blocked/unknown/reconnect/replaced attachment never imply success', () => {
  let snapshot = reduceActivity(initial(), inventory('idle'), 100, 30);
  assert.equal(snapshot.panes[1].lastActivityAt, null);
  snapshot = reduceActivity(snapshot, inventory('working'), 110, 30);
  snapshot = reduceActivity(snapshot, inventory('idle'), 120, 30);
  assert.equal(
    snapshot.panes.find((p) => p.id === 'p1')?.attention,
    'turn-ended'
  );
  snapshot = reduceActivity(snapshot, inventory('idle'), 151, 30);
  assert.equal(snapshot.panes.find((p) => p.id === 'p1')?.attention, null);
  snapshot = reduceActivity(snapshot, inventory('blocked'), 160, 30);
  assert.equal(snapshot.panes.find((p) => p.id === 'p1')?.rawStatus, 'blocked');
  assert.equal(snapshot.panes.find((p) => p.id === 'p1')?.attention, null);
  snapshot = reduceActivity(snapshot, inventory('working'), 170, 30);
  const disconnected = {
    ...snapshot,
    connection: { ...snapshot.connection, state: 'disconnected' as const },
  };
  assert.equal(
    reduceActivity(disconnected, inventory('idle'), 180, 30).panes.find(
      (p) => p.id === 'p1'
    )?.attention,
    null
  );
  const replaced = normalizeInventory(
    [agent('idle', { agent_session: { value: 'new' } })],
    [],
    []
  );
  assert.equal(
    reduceActivity(snapshot, replaced, 180, 30).panes[0].attention,
    null
  );
  assert.equal(
    reduceActivity(snapshot, inventory('unknown'), 180, 30).panes.find(
      (p) => p.id === 'p1'
    )?.attention,
    null
  );
});

test('socket override and HERDR_CONFIG_PATH are respected', () => {
  assert.equal(
    resolveSocketPath({ HERDR_SOCKET_PATH: '/tmp/custom.sock' }),
    '/tmp/custom.sock'
  );
  assert.equal(
    resolveSocketPath({ HERDR_CONFIG_PATH: '/tmp/custom/config.toml' }),
    '/tmp/custom/herdr.sock'
  );
  assert.equal(
    resolveSocketPath({ XDG_CONFIG_HOME: '/tmp/config' }),
    '/tmp/config/herdr/herdr.sock'
  );
});

test('fragmented replies, retained stale inventory, reconnect, and stop/start cleanup', async () => {
  const fixture = await fake();
  const observer = createObserver({
    socketPath: fixture.path,
    pollMs: 10,
    timeoutMs: 40,
  });
  try {
    observer.start();
    observer.start();
    await until(() => observer.getSnapshot().connection.state === 'connected');
    assert.equal(observer.getSnapshot().panes.length, 2);
    const copy = observer.getSnapshot();
    copy.panes.length = 0;
    assert.equal(observer.getSnapshot().panes.length, 2);
    fixture.mode('close');
    await until(
      () => observer.getSnapshot().connection.state === 'disconnected'
    );
    assert.equal(observer.getSnapshot().panes.length, 2);
    assert.ok(observer.getSnapshot().connection.lastSuccessAt);
    fixture.status('idle');
    fixture.mode('normal');
    await until(() => observer.getSnapshot().connection.state === 'connected');
    assert.equal(
      observer.getSnapshot().panes.find((p) => p.id === 'p1')?.attention,
      null
    );
    assert.deepEqual([...new Set(fixture.calls)].sort(), [
      'agent.list',
      'pane.list',
      'workspace.list',
    ]);
    fixture.mode('hang');
    await delay(20);
    observer.stop();
    await until(() => fixture.sockets.size === 0);
    const count = fixture.calls.length;
    await delay(60);
    assert.equal(fixture.calls.length, count);
    fixture.mode('normal');
    observer.start();
    await until(() => observer.getSnapshot().connection.state === 'connected');
  } finally {
    observer.stop();
    await fixture.close();
  }
});

test('transport rejects malformed, invalid shape, truncated, oversized and timed-out responses', async () => {
  const fixture = await fake();
  try {
    for (const mode of [
      'malformed',
      'bad-shape',
      'close',
      'oversize',
      'hang',
    ]) {
      fixture.mode(mode);
      await assert.rejects(
        readList(fixture.path, 'pane.list', 80, new AbortController().signal)
      );
    }
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      readList(fixture.path, 'pane.list', 80, controller.signal),
      /stopped/
    );
  } finally {
    await fixture.close();
  }
});

test('read-only HTTP, Host/Origin rejection, SSE snapshot, and client teardown', async () => {
  const fixture = await fake();
  const observer = createObserver({ socketPath: fixture.path, pollMs: 20 });
  let subscriptions = 0;
  const server = await createActivityServer(
    {
      ...observer,
      subscribe(listener) {
        subscriptions++;
        const off = observer.subscribe(listener);
        return () => {
          subscriptions--;
          off();
        };
      },
    },
    { port: 0 }
  );
  observer.start();
  try {
    await until(() => observer.getSnapshot().connection.state === 'connected');
    const response = await fetch(`${server.url}/api/v1/snapshot`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).version, 1);
    assert.equal(
      (await fetch(`${server.url}/api/v1/snapshot`, { method: 'POST' })).status,
      405
    );
    assert.equal(
      (
        await fetch(`${server.url}/api/v1/snapshot`, {
          headers: { Origin: 'https://evil.example' },
        })
      ).status,
      403
    );
    const invalidHostStatus = await new Promise<number | undefined>(
      (resolve, reject) => {
        get(
          `${server.url}/api/v1/snapshot`,
          { headers: { Host: 'evil.example' } },
          (response) => {
            response.resume();
            resolve(response.statusCode);
          }
        ).on('error', reject);
      }
    );
    assert.equal(invalidHostStatus, 403);
    assert.equal((await fetch(`${server.url}/pane/close`)).status, 404);
    const abort = new AbortController();
    const events = await fetch(`${server.url}/api/v1/events`, {
      signal: abort.signal,
    });
    const reader = events.body!.getReader();
    const first = new TextDecoder().decode((await reader.read()).value);
    assert.match(first, /event: snapshot/);
    assert.match(first, /"version":1/);
    assert.equal(subscriptions, 1);
    abort.abort();
    await reader.cancel().catch(() => {});
    await until(() => subscriptions === 0);
  } finally {
    await server.close();
    observer.stop();
    await fixture.close();
  }
});

test('a subscriber may stop the observer during its initial notification', () => {
  const observer = createObserver({
    socketPath: '/tmp/unused-herdr-activity.sock',
  });
  observer.subscribe((snapshot) => {
    if (snapshot.connection.state === 'connecting') observer.stop();
  });
  observer.start();
  assert.equal(observer.getSnapshot().connection.state, 'disconnected');
});
