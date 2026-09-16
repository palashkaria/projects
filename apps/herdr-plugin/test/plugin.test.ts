import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { setup, unsetup, readApiUrl, apiUrl } from '../src/config.js';
import { plain, render } from '../src/render.js';

test('setup is idempotent and reversible and preserves foreign or edited config', async () => {
  const directory = await mkdtemp('/tmp/herdr-plugin-');
  const path = join(directory, 'config', 'activity.json');
  try {
    await setup(path, 'http://127.0.0.1:43187');
    await setup(path, 'http://127.0.0.1:43187');
    assert.equal(await readApiUrl(path), 'http://127.0.0.1:43187');
    await unsetup(path);
    await unsetup(path);
    await assert.rejects(readFile(path), { code: 'ENOENT' });
    await writeFile(path, 'user configuration');
    await assert.rejects(setup(path, 'http://127.0.0.1:43187'));
    await assert.rejects(unsetup(path));
    assert.equal(await readFile(path, 'utf8'), 'user configuration');
    assert.throws(() => apiUrl('https://remote.example/'));
    assert.throws(() => apiUrl('http://127.0.0.1:43187/path'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('terminal output groups recent activity, distinguishes stale and unknown, and strips control characters', () => {
  const output = render(
    {
      version: 1,
      revision: 1,
      endpoint: 'fake',
      connection: {
        state: 'disconnected',
        lastSuccessAt: 100,
        error: 'socket closed',
      },
      workspaces: [{ id: 'empty', name: 'Empty' }],
      panes: [
        {
          id: 'p1',
          workspaceId: null,
          title: '\x1b[2Jtitle\nnew',
          cwd: null,
          agent: null,
          sessionId: null,
          rawStatus: 'unknown',
          reportedStatus: 'done',
          attention: null,
          lastActivityAt: null,
        },
      ],
    },
    200
  );
  assert.match(output, /DISCONNECTED/);
  assert.match(output, /empty workspace/);
  assert.match(output, /activity unknown/);
  assert.match(output, /\[unknown\]/);
  assert.doesNotMatch(output, /\x1b/);
  assert.match(output, /task success/);
  assert.equal(plain('\x9bhello\r'), ' hello ');
});
