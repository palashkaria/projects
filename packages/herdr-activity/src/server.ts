import { createServer, type ServerResponse } from 'node:http';
import type { ActivityObserver } from './observer.js';
/** The caller owns observer lifecycle. Close this server before stopping the observer. */
export async function createActivityServer(
  observer: ActivityObserver,
  options: { port?: number } = {}
) {
  const clients = new Set<ServerResponse>();
  const server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const address = server.address();
    const host =
      typeof address === 'object' && address ? `127.0.0.1:${address.port}` : '';
    if (
      request.headers.host !== host ||
      (request.headers.origin && request.headers.origin !== `http://${host}`)
    ) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if (request.method !== 'GET') {
      response.writeHead(405, { Allow: 'GET' }).end();
      return;
    }
    if (request.url === '/api/v1/snapshot') {
      response
        .writeHead(200, { 'Content-Type': 'application/json' })
        .end(JSON.stringify(observer.getSnapshot()));
      return;
    }
    if (request.url !== '/api/v1/events') {
      response.writeHead(404).end();
      return;
    }
    if (clients.size >= 32) {
      response.writeHead(503).end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
    });
    clients.add(response);
    const send = () => {
      const snapshot = observer.getSnapshot();
      if (
        !response.write(
          `event: snapshot\nid: ${snapshot.revision}\ndata: ${JSON.stringify(
            snapshot
          )}\n\n`
        )
      )
        response.destroy();
    };
    const unsubscribe = observer.subscribe(send);
    const heartbeat = setInterval(() => {
      if (!response.write(': heartbeat\n\n')) response.destroy();
    }, 15000);
    response.on('close', () => {
      unsubscribe();
      clearInterval(heartbeat);
      clients.delete(response);
    });
    send();
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 43187, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('No HTTP address');
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        for (const client of clients) client.destroy();
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}
