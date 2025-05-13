// server.ts

import express from 'express';
import * as path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as queuePort from '../dist'

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
// Change this to your target server
const TARGET_SERVER = 'http://localhost:8765';

// Proxy all requests
app.use(
  '/',
  createProxyMiddleware({
    target: TARGET_SERVER,
  })
);

queuePort.start({
  port: 8765,
  enableDashboardServer: true,
  dashboardServerPort: 8760
}).then(() => {
  app.listen(3011, () => {
    console.log('Server running at http://localhost:3011');
  });
})


