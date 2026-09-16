import { connect } from 'node:net';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { record } from './normalize.js';
export function resolveSocketPath(
  env: NodeJS.ProcessEnv = process.env
): string {
  const config =
    env.HERDR_CONFIG_PATH ??
    join(
      env.XDG_CONFIG_HOME ?? join(homedir(), '.config'),
      'herdr',
      'config.toml'
    );
  const path = env.HERDR_SOCKET_PATH ?? join(dirname(config), 'herdr.sock');
  return process.platform === 'win32' && !path.startsWith('\\\\.\\pipe\\')
    ? `\\\\.\\pipe\\${path}`
    : path;
}
export function readList(
  socketPath: string,
  method: 'agent.list' | 'pane.list' | 'workspace.list',
  timeoutMs: number,
  signal: AbortSignal
): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Observer stopped'));
      return;
    }
    const socket = connect(socketPath);
    let buffer = '';
    let settled = false;
    const finish = (error: Error | null, list: unknown[] = []) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      signal.removeEventListener('abort', abort);
      socket.destroy();
      if (error) reject(error);
      else resolve(list);
    };
    const abort = () => finish(new Error('Observer stopped'));
    const deadline = setTimeout(
      () => finish(new Error('Herdr request timed out')),
      timeoutMs
    );
    signal.addEventListener('abort', abort, { once: true });
    socket.setEncoding('utf8');
    socket.on('error', (error) => finish(error));
    socket.on('close', () =>
      finish(new Error('Herdr closed before a complete response'))
    );
    socket.on('connect', () =>
      socket.write(
        JSON.stringify({ id: 'activity-v1', method, params: {} }) + '\n'
      )
    );
    socket.on('data', (chunk) => {
      buffer += chunk;
      if (Buffer.byteLength(buffer) > 4 * 1024 * 1024) {
        finish(new Error('Herdr response exceeds 4 MiB'));
        return;
      }
      const newline = buffer.indexOf('\n');
      if (newline < 0) return;
      try {
        const reply = record(JSON.parse(buffer.slice(0, newline)));
        if (reply.id !== 'activity-v1' || reply.error)
          throw new Error('Herdr rejected the inventory request');
        const result = record(reply.result);
        const key =
          method === 'agent.list'
            ? 'agents'
            : method === 'pane.list'
            ? 'panes'
            : 'workspaces';
        if (!Array.isArray(result[key]))
          throw new Error(`Invalid Herdr ${key} inventory`);
        finish(null, result[key]);
      } catch (error) {
        finish(
          error instanceof Error ? error : new Error('Invalid Herdr response')
        );
      }
    });
  });
}
