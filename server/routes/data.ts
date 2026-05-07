import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

// ── Operations ────────────────────────────────────────────────────────────────
router.get('/operations', (req, res) => {
  res.json(db.prepare('SELECT * FROM operations WHERE org_id = ? ORDER BY created_at DESC').all(req.user.orgId));
});
router.post('/operations', (req, res) => {
  const { name, status = 'planning', market = '', revenue = 0 } = req.body;
  if (!name) { res.status(400).json({ error: 'name required' }); return; }
  const op = { id: randomUUID(), org_id: req.user.orgId, name, status, market, revenue: Number(revenue), created_at: new Date().toISOString() };
  db.prepare('INSERT INTO operations (id, org_id, name, status, market, revenue, created_at) VALUES (?,?,?,?,?,?,?)').run(
    op.id, op.org_id, op.name, op.status, op.market, op.revenue, op.created_at
  );
  res.status(201).json(op);
});
router.put('/operations/:id', (req, res) => {
  const op = db.prepare('SELECT id FROM operations WHERE id = ? AND org_id = ?').get(req.params.id, req.user.orgId);
  if (!op) { res.status(404).json({ error: 'Not found' }); return; }
  const { name, status, market, revenue } = req.body;
  db.prepare('UPDATE operations SET name=COALESCE(?,name), status=COALESCE(?,status), market=COALESCE(?,market), revenue=COALESCE(?,revenue) WHERE id=?').run(
    name ?? null, status ?? null, market ?? null, revenue != null ? Number(revenue) : null, req.params.id
  );
  res.json(db.prepare('SELECT * FROM operations WHERE id = ?').get(req.params.id));
});
router.delete('/operations/:id', (req, res) => {
  db.prepare('DELETE FROM operations WHERE id = ? AND org_id = ?').run(req.params.id, req.user.orgId);
  res.status(204).send();
});

// ── Drills ────────────────────────────────────────────────────────────────────
router.get('/drills', (req, res) => {
  res.json(db.prepare('SELECT * FROM drills WHERE org_id = ?').all(req.user.orgId));
});
router.post('/drills', (req, res) => {
  const { name, type = 'revenue', target = 0, current = 0, status = 'active' } = req.body;
  if (!name) { res.status(400).json({ error: 'name required' }); return; }
  const d = { id: randomUUID(), org_id: req.user.orgId, name, type, target: Number(target), current: Number(current), status };
  db.prepare('INSERT INTO drills (id, org_id, name, type, target, current, status) VALUES (?,?,?,?,?,?,?)').run(
    d.id, d.org_id, d.name, d.type, d.target, d.current, d.status
  );
  res.status(201).json(d);
});
router.put('/drills/:id', (req, res) => {
  const d = db.prepare('SELECT id FROM drills WHERE id = ? AND org_id = ?').get(req.params.id, req.user.orgId);
  if (!d) { res.status(404).json({ error: 'Not found' }); return; }
  const { name, type, target, current, status } = req.body;
  db.prepare('UPDATE drills SET name=COALESCE(?,name), type=COALESCE(?,type), target=COALESCE(?,target), current=COALESCE(?,current), status=COALESCE(?,status) WHERE id=?').run(
    name ?? null, type ?? null, target != null ? Number(target) : null, current != null ? Number(current) : null, status ?? null, req.params.id
  );
  res.json(db.prepare('SELECT * FROM drills WHERE id = ?').get(req.params.id));
});
router.delete('/drills/:id', (req, res) => {
  db.prepare('DELETE FROM drills WHERE id = ? AND org_id = ?').run(req.params.id, req.user.orgId);
  res.status(204).send();
});

// ── Units ─────────────────────────────────────────────────────────────────────
router.get('/units', (req, res) => {
  res.json(db.prepare('SELECT * FROM units WHERE org_id = ?').all(req.user.orgId));
});
router.post('/units', (req, res) => {
  const { name, lead = '', headcount = 0, focus = '', performance = 0 } = req.body;
  if (!name) { res.status(400).json({ error: 'name required' }); return; }
  const u = { id: randomUUID(), org_id: req.user.orgId, name, lead, headcount: Number(headcount), focus, performance: Number(performance) };
  db.prepare('INSERT INTO units (id, org_id, name, lead, headcount, focus, performance) VALUES (?,?,?,?,?,?,?)').run(
    u.id, u.org_id, u.name, u.lead, u.headcount, u.focus, u.performance
  );
  res.status(201).json(u);
});
router.put('/units/:id', (req, res) => {
  const u = db.prepare('SELECT id FROM units WHERE id = ? AND org_id = ?').get(req.params.id, req.user.orgId);
  if (!u) { res.status(404).json({ error: 'Not found' }); return; }
  const { name, lead, headcount, focus, performance } = req.body;
  db.prepare('UPDATE units SET name=COALESCE(?,name), lead=COALESCE(?,lead), headcount=COALESCE(?,headcount), focus=COALESCE(?,focus), performance=COALESCE(?,performance) WHERE id=?').run(
    name ?? null, lead ?? null, headcount != null ? Number(headcount) : null, focus ?? null, performance != null ? Number(performance) : null, req.params.id
  );
  res.json(db.prepare('SELECT * FROM units WHERE id = ?').get(req.params.id));
});
router.delete('/units/:id', (req, res) => {
  db.prepare('DELETE FROM units WHERE id = ? AND org_id = ?').run(req.params.id, req.user.orgId);
  res.status(204).send();
});

// ── Personnel ─────────────────────────────────────────────────────────────────
router.get('/personnel', (req, res) => {
  res.json(db.prepare('SELECT * FROM personnel WHERE org_id = ?').all(req.user.orgId));
});
router.post('/personnel', (req, res) => {
  const { name, role = '', clearance = 'Delta', unit = '', status = 'active' } = req.body;
  if (!name) { res.status(400).json({ error: 'name required' }); return; }
  const p = { id: randomUUID(), org_id: req.user.orgId, name, role, clearance, unit, status };
  db.prepare('INSERT INTO personnel (id, org_id, name, role, clearance, unit, status) VALUES (?,?,?,?,?,?,?)').run(
    p.id, p.org_id, p.name, p.role, p.clearance, p.unit, p.status
  );
  res.status(201).json(p);
});
router.put('/personnel/:id', (req, res) => {
  const p = db.prepare('SELECT id FROM personnel WHERE id = ? AND org_id = ?').get(req.params.id, req.user.orgId);
  if (!p) { res.status(404).json({ error: 'Not found' }); return; }
  const { name, role, clearance, unit, status } = req.body;
  db.prepare('UPDATE personnel SET name=COALESCE(?,name), role=COALESCE(?,role), clearance=COALESCE(?,clearance), unit=COALESCE(?,unit), status=COALESCE(?,status) WHERE id=?').run(
    name ?? null, role ?? null, clearance ?? null, unit ?? null, status ?? null, req.params.id
  );
  res.json(db.prepare('SELECT * FROM personnel WHERE id = ?').get(req.params.id));
});
router.delete('/personnel/:id', (req, res) => {
  db.prepare('DELETE FROM personnel WHERE id = ? AND org_id = ?').run(req.params.id, req.user.orgId);
  res.status(204).send();
});

export default router;
