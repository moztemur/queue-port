import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer } from 'ws';
import { getAllQueueStates } from '../queue/queueActor';
import { URL } from 'url';
import { createLogger } from '../utils/logger';

const log = createLogger('dashboard-server');

const PUBLIC_DIR = path.join(__dirname, 'public');

const createServer = () => {
  // --- Serve Static Files ---
  const server = http.createServer((req, res) => {
    const method = req.method || '';
    const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    if (method === 'GET') {
      const safePath = pathname === '/' ? '/index.html' : pathname;
      const filePath = path.join(PUBLIC_DIR, safePath);
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          const ext = path.extname(filePath);
          const contentType =
            ext === '.html' ? 'text/html' :
              ext === '.js' ? 'text/javascript' :
                ext === '.css' ? 'text/css' :
                  'application/octet-stream';

          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    } else {
      res.writeHead(405);
      res.end('Method Not Allowed');
    }
  });

  return server

}

// Broadcast queue state to all connected clients
function broadcastState(wss: WebSocketServer) {
  const state = getAllQueueStates();
  log('Broadcasting state:', state);
  const payload = JSON.stringify({ type: 'state', queues: state });
  wss.clients.forEach((client: any) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
}

const start = (port: number): Promise<void> => {
  const server = createServer();

  // --- WebSocket Server for Live Dashboard ---
  const wss = new WebSocketServer({ server });

  // Periodic update for all WebSocket clients (e.g., every 1s)
  setInterval(() => { broadcastState(wss) }, 1000);

  return new Promise((resolve) => {
      // Start HTTP + WebSocket server
  server.listen(port, () => {
    log(`🚀 Dashboard available at http://localhost:${port}`);
    resolve()
  });
  })
}

export { start };
