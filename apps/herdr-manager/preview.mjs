// Static prototype preview plus an allowlisted proxy. No observer or Herdr RPC here.
import { build } from 'esbuild';
import { createServer, request } from 'node:http';
import { readFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const production = process.argv[2] === 'build';
const out = `${root}${production ? '.prototype-dist' : '.prototype-preview'}`;
await mkdir(out, { recursive: true });
await build({
  entryPoints: [`${root}src/app.js`],
  bundle: true,
  format: 'esm',
  outfile: `${out}/app.js`,
  define: { __PROTOTYPE_DEV__: String(!production) },
});
await Promise.all(
  ['index.html', 'styles.css'].map((name) =>
    copyFile(
      `${root}${name === 'styles.css' ? 'src/' : ''}${name}`,
      `${out}/${name}`
    )
  )
);
if (production || process.argv[2] === 'refresh') {
  console.log(
    production
      ? 'Prototype build complete (switcher hidden).'
      : 'Preview assets refreshed.'
  );
  process.exit(0);
}
const port = Number(process.env.HERDR_UI_PORT || 43188);
const activityPort = Number(process.env.HERDR_ACTIVITY_PORT || 43187);
const routes = new Map([
  ['/', 'index.html'],
  ['/prototype/activity', 'index.html'],
  ['/app.js', 'app.js'],
  ['/styles.css', 'styles.css'],
]);
const server = createServer(async (req, res) => {
  if (!['127.0.0.1:' + port, 'localhost:' + port].includes(req.headers.host)) {
    res.writeHead(403).end();
    return;
  }
  if (req.method !== 'GET') {
    res.writeHead(405).end('Read-only prototype');
    return;
  }
  const path = new URL(req.url, 'http://localhost').pathname;
  if (['/api/v1/snapshot', '/api/v1/events'].includes(path)) {
    const upstream = request(
      { hostname: '127.0.0.1', port: activityPort, path, method: 'GET' },
      (reply) => {
        res.writeHead(reply.statusCode || 502, {
          'Content-Type': reply.headers['content-type'] || 'application/json',
          'Cache-Control': 'no-store',
        });
        reply.pipe(res);
      }
    );
    upstream.on('error', () => {
      if (!res.headersSent)
        res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Shared activity server unavailable' }));
    });
    res.on('close', () => upstream.destroy());
    upstream.end();
    return;
  }
  const file = routes.get(path);
  if (!file) {
    res.writeHead(404).end('Not found');
    return;
  }
  const type = file.endsWith('.js')
    ? 'text/javascript'
    : file.endsWith('.css')
    ? 'text/css'
    : 'text/html';
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(await readFile(`${out}/${file}`));
});
server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () =>
  console.log(
    `Herdr prototype http://127.0.0.1:${port}/prototype/activity?variant=attention (PID ${process.pid}); shared API :${activityPort}`
  )
);
