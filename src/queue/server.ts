// server.ts
import http from 'http';
import { createLogger } from '../utils/logger';
import { getQueue } from './queueActor';

const log = createLogger('queue-server');

const parseBody = async (req: http.IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString();
  return body ? JSON.parse(body) : {};
};

const createServer = () => {
  const server = http.createServer(async (req, res) => {
    const { method, url } = req;
    log(`Received ${method} request for ${url}`);
  
    const match = url?.match(/^\/(enqueue|dequeue|size)\/([^/]+)$/);
    if (!match) {
      res.writeHead(404).end('Not Found');
      return;
    }
  
    const action = match[1];
    const queueName = decodeURIComponent(match[2]);

    if (queueName.length === 0) {
      res.writeHead(400).end('Missing or invalid queue name');
      return;
    }
  
    if (method === 'POST' && action === 'enqueue') {
      const { items } = await parseBody(req);
      if (!Array.isArray(items)) {
        res.writeHead(400).end('Missing or invalid items array');
        return;
      }
      await getQueue(queueName).enqueue(items);
      res.writeHead(200).end('Enqueued');
    }
  
    else if (method === 'POST' && action === 'dequeue') {
      const { count, timeout } = await parseBody(req);
      if (count && typeof count !== 'number') {
        res.writeHead(400).end('Missing or invalid count');
        return;
      }

      if (timeout && typeof timeout !== 'number') {
        res.writeHead(400).end('Missing or invalid timeout');
        return;
      }

      const result = await getQueue(queueName).dequeue(count, timeout);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }
  
    else if (method === 'GET' && action === 'size') {
      const size = await getQueue(queueName).queueSize();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ size }));
    }
  
    else {
      res.writeHead(405).end('Method Not Allowed');
    }
  });

  return server;
}


const start = (port: number = 8765): Promise<void> => {
  log(`Starting queue server on port ${port}`);

  const server = createServer();

  return new Promise((resolve) => {
    server.listen(port, () => {
      log(`Queue server running at http://localhost:${port}`);
      resolve()
    });
  })
}


export { start }
