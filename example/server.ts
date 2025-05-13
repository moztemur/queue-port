// server.ts

import express from 'express';
import * as path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';

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

app.listen(3011, () => {
  console.log('Server running at http://localhost:3011');
});
