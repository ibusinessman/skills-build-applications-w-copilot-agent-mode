import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

app.use(express.json());

// In-memory stores
let operations: Array<{ id: string; name: string; status: string; market: string; revenue: number; createdAt: string }> = [
  { id: '1', name: 'Alpha Expansion', status: 'active', market: 'North America', revenue: 125000, createdAt: new Date().toISOString() },
  { id: '2', name: 'Beta Penetration', status: 'planning', market: 'Europe', revenue: 87000, createdAt: new Date().toISOString() },
];

let drills: Array<{ id: string; name: string; type: string; target: number; current: number; status: string }> = [
  { id: '1', name: 'Q4 Revenue Sprint', type: 'revenue', target: 500000, current: 312000, status: 'active' },
  { id: '2', name: 'Market Share Drill', type: 'market', target: 25, current: 18, status: 'active' },
];

let units: Array<{ id: string; name: string; lead: string; headcount: number; focus: string; performance: number }> = [
  { id: '1', name: 'Vanguard Unit', lead: 'Sarah Chen', headcount: 12, focus: 'Enterprise', performance: 94 },
  { id: '2', name: 'Nexus Unit', lead: 'Marcus Webb', headcount: 8, focus: 'SMB', performance: 87 },
];

let personnel: Array<{ id: string; name: string; role: string; clearance: string; unit: string; status: string }> = [
  { id: '1', name: 'Sarah Chen', role: 'Unit Lead', clearance: 'Alpha', unit: 'Vanguard', status: 'active' },
  { id: '2', name: 'Marcus Webb', role: 'Unit Lead', clearance: 'Alpha', unit: 'Nexus', status: 'active' },
  { id: '3', name: 'Jordan Kim', role: 'Analyst', clearance: 'Beta', unit: 'Vanguard', status: 'active' },
];

// REST routes
app.get('/api/operations', (_req, res) => res.json(operations));
app.post('/api/operations', (req, res) => {
  const op = { ...req.body, id: Date.now().toString(), createdAt: new Date().toISOString() };
  operations.push(op);
  res.status(201).json(op);
});
app.put('/api/operations/:id', (req, res) => {
  const idx = operations.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  operations[idx] = { ...operations[idx], ...req.body };
  res.json(operations[idx]);
});
app.delete('/api/operations/:id', (req, res) => {
  operations = operations.filter(o => o.id !== req.params.id);
  res.status(204).send();
});

app.get('/api/drills', (_req, res) => res.json(drills));
app.post('/api/drills', (req, res) => {
  const drill = { ...req.body, id: Date.now().toString() };
  drills.push(drill);
  res.status(201).json(drill);
});
app.put('/api/drills/:id', (req, res) => {
  const idx = drills.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  drills[idx] = { ...drills[idx], ...req.body };
  res.json(drills[idx]);
});
app.delete('/api/drills/:id', (req, res) => {
  drills = drills.filter(d => d.id !== req.params.id);
  res.status(204).send();
});

app.get('/api/units', (_req, res) => res.json(units));
app.post('/api/units', (req, res) => {
  const unit = { ...req.body, id: Date.now().toString() };
  units.push(unit);
  res.status(201).json(unit);
});
app.put('/api/units/:id', (req, res) => {
  const idx = units.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  units[idx] = { ...units[idx], ...req.body };
  res.json(units[idx]);
});
app.delete('/api/units/:id', (req, res) => {
  units = units.filter(u => u.id !== req.params.id);
  res.status(204).send();
});

app.get('/api/personnel', (_req, res) => res.json(personnel));
app.post('/api/personnel', (req, res) => {
  const person = { ...req.body, id: Date.now().toString() };
  personnel.push(person);
  res.status(201).json(person);
});
app.put('/api/personnel/:id', (req, res) => {
  const idx = personnel.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  personnel[idx] = { ...personnel[idx], ...req.body };
  res.json(personnel[idx]);
});
app.delete('/api/personnel/:id', (req, res) => {
  personnel = personnel.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

// WebSocket: broadcast integrity updates every 5s
wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');
  ws.on('close', () => console.log('WebSocket client disconnected'));
});

setInterval(() => {
  const score = Math.floor(70 + Math.random() * 25);
  const delta = (Math.random() * 6 - 3).toFixed(1);
  const payload = JSON.stringify({
    type: 'INTEGRITY_UPDATE',
    data: {
      healthScore: score,
      timestamp: new Date().toISOString(),
      delta: parseFloat(delta),
    },
  });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}, 5000);

// Vite dev middleware in development
const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`SATOR server running at http://localhost:${PORT}`);
});
