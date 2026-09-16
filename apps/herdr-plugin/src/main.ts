import {
  createObserver,
  createActivityServer,
  resolveSocketPath,
  parseActivitySnapshot,
  type ActivitySnapshot,
} from '@org/herdr-activity';
import { spawnSync } from 'node:child_process';
import {
  apiUrl,
  configPath,
  pluginId,
  readApiUrl,
  setup,
  unsetup,
} from './config.js';
import { plain, render } from './render.js';

async function popup(url: string) {
  if (!process.stdout.isTTY || !process.stdin.isTTY)
    throw new Error('Popup requires a terminal');
  let snapshot: ActivitySnapshot | undefined,
    error = '',
    offset = 0,
    stopped = false;
  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const wasRaw = process.stdin.isRaw;
  const draw = () => {
    const lines = (
      snapshot ? render(snapshot) : 'Herdr Activity\nWaiting for observer.'
    ).split('\n');
    if (error)
      lines.unshift(
        `OBSERVER DISCONNECTED — ${plain(error)}`,
        'Retained data below is stale.'
      );
    const rows = Math.max(3, (process.stdout.rows || 24) - 1);
    offset = Math.min(offset, Math.max(0, lines.length - rows));
    process.stdout.write(
      '\x1b[H\x1b[2J' +
        lines
          .slice(offset, offset + rows)
          .map((line) =>
            line.slice(0, Math.max(1, (process.stdout.columns || 80) - 1))
          )
          .join('\n')
    );
  };
  const close = () => {
    if (stopped) return;
    stopped = true;
    controller?.abort();
    clearTimeout(timer);
    process.stdin.setRawMode(wasRaw);
    process.stdin.pause();
    process.stdin.off('data', key);
    process.stdout.off('resize', draw);
    process.off('SIGINT', close);
    process.off('SIGTERM', close);
    process.stdout.write('\x1b[?25h\x1b[?1049l');
  };
  const key = (data: Buffer) => {
    const value = data.toString();
    if (value === 'q' || value === '\x1b' || value === '\x03') close();
    else if (value === '\x1b[B') {
      offset += 1;
      draw();
    } else if (value === '\x1b[A') {
      offset = Math.max(0, offset - 1);
      draw();
    }
  };
  const refresh = async () => {
    controller = new AbortController();
    const deadline = setTimeout(() => controller?.abort(), 3000);
    try {
      const response = await fetch(`${url}/api/v1/snapshot`, {
        signal: controller.signal,
        redirect: 'error',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = parseActivitySnapshot(await response.json());
      snapshot = next;
      error = '';
    } catch (failure) {
      error =
        failure instanceof Error ? failure.message : 'Observer unavailable';
      if (snapshot)
        snapshot = {
          ...snapshot,
          connection: { ...snapshot.connection, state: 'disconnected', error },
        };
    } finally {
      clearTimeout(deadline);
    }
    if (!stopped) {
      draw();
      timer = setTimeout(() => void refresh(), 2000);
    }
  };
  process.stdout.write('\x1b[?1049h\x1b[?25l');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', key);
  process.stdout.on('resize', draw);
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
  draw();
  await refresh();
}
async function main() {
  const [command = 'serve', ...args] = process.argv.slice(2);
  if (
    !['serve', 'popup', 'open', 'setup', 'unsetup', 'help', '--help'].includes(
      command
    )
  )
    throw new Error(`Unknown command: ${command}`);
  const options = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index],
      value = args[index + 1];
    if (
      !['--config', '--api-url', '--socket', '--port'].includes(name) ||
      !value ||
      value.startsWith('--')
    )
      throw new Error(
        'Expected --config, --api-url, --socket or --port followed by a value'
      );
    options.set(name, value);
  }
  const path = options.get('--config') ?? configPath();
  if (command === 'help' || command === '--help') {
    console.log(
      'Herdr Activity: serve [--socket PATH] [--port 43187] | popup [--api-url URL] | open | setup [--config PATH] [--api-url URL] | unsetup [--config PATH]'
    );
    return;
  }
  if (command === 'setup') {
    await setup(path, options.get('--api-url') ?? 'http://127.0.0.1:43187');
    console.log(`Configured ${path}`);
    return;
  }
  if (command === 'unsetup') {
    await unsetup(path);
    console.log(`Removed owned config ${path}`);
    return;
  }
  if (command === 'open') {
    const result = spawnSync(
      process.env.HERDR_BIN_PATH ?? 'herdr',
      [
        'plugin',
        'pane',
        'open',
        '--plugin',
        pluginId,
        '--entrypoint',
        'activity',
      ],
      { stdio: 'inherit', timeout: 5000 }
    );
    if (result.error || result.status !== 0)
      throw result.error ?? new Error('Could not open activity popup');
    return;
  }
  if (command === 'popup') {
    await popup(
      apiUrl(
        options.get('--api-url') ??
          process.env.HERDR_ACTIVITY_API_URL ??
          (await readApiUrl(path))
      )
    );
    return;
  }
  const port = Number(
    options.get('--port') ?? process.env.HERDR_ACTIVITY_PORT ?? 43187
  );
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('Port must be 1–65535');
  const observer = createObserver({
    socketPath: options.get('--socket') ?? resolveSocketPath(),
  });
  const server = await createActivityServer(observer, { port });
  observer.start();
  console.log(`Herdr Activity API: ${server.url} (Ctrl-C to stop)`);
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    await server.close();
    observer.stop();
  };
  process.once('SIGINT', () => void close());
  process.once('SIGTERM', () => void close());
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
