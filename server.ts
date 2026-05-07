import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Import DB first (runs migrations + seed)
import './server/db.js';

import authRoutes from './server/routes/auth.js';
import orgRoutes from './server/routes/orgs.js';
import billingRoutes from './server/routes/billing.js';
import dataRoutes from './server/routes/data.js';
import aiRoutes from './server/routes/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', dataRoutes); // operations, drills, units, personnel

// WebSocket: system integrity broadcasts
const wss = new WebSocketServer({ server: httpServer });
wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');
  ws.on('close', () => console.log('WebSocket client disconnected'));
});
setInterval(() => {
  const score = Math.floor(70 + Math.random() * 25);
  const delta = parseFloat((Math.random() * 6 - 3).toFixed(1));
  const payload = JSON.stringify({
    type: 'INTEGRITY_UPDATE',
    data: { healthScore: score, timestamp: new Date().toISOString(), delta },
  });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}, 5000);

// Vite dev middleware / static in production
const isDev = process.env.NODE_ENV !== 'production';
if (isDev) {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`SATOR SaaS server → http://localhost:${PORT}`);
});
