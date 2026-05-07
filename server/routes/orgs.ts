import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db, PLAN_LIMITS, getMonthlyUsage } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/orgs/current
router.get('/current', (req, res) => {
  const org = db.prepare('SELECT * FROM orgs WHERE id = ?').get(req.user.orgId) as any;
  if (!org) { res.status(404).json({ error: 'Org not found' }); return; }
  const limits = PLAN_LIMITS[org.plan] ?? PLAN_LIMITS.free;
  const usage = getMonthlyUsage(org.id);
  res.json({ ...org, usage, limits });
});

// PUT /api/orgs/current (admin only)
router.put('/current', requireAdmin, (req, res) => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: 'name required' }); return; }
  db.prepare('UPDATE orgs SET name = ? WHERE id = ?').run(name, req.user.orgId);
  res.json(db.prepare('SELECT * FROM orgs WHERE id = ?').get(req.user.orgId));
});

// GET /api/orgs/members
router.get('/members', (req, res) => {
  const members = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE org_id = ?').all(req.user.orgId);
  const invites = db.prepare(
    "SELECT id, email, role, created_by, expires_at FROM org_invites WHERE org_id = ? AND accepted_at IS NULL AND expires_at > ?"
  ).all(req.user.orgId, new Date().toISOString());
  res.json({ members, invites });
});

// POST /api/orgs/invite (admin only)
router.post('/invite', requireAdmin, (req, res) => {
  const { email, role = 'member' } = req.body;
  if (!email) { res.status(400).json({ error: 'email required' }); return; }

  const org = db.prepare('SELECT plan FROM orgs WHERE id = ?').get(req.user.orgId) as any;
  const limits = PLAN_LIMITS[org.plan];
  if (limits.users !== -1) {
    const count = (db.prepare('SELECT COUNT(*) as c FROM users WHERE org_id = ?').get(req.user.orgId) as any).c;
    if (count >= limits.users) {
      res.status(403).json({ error: `Plan limit reached (${limits.users} users). Upgrade to add more.` });
      return;
    }
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) { res.status(409).json({ error: 'User already has an account' }); return; }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO org_invites (id, org_id, email, role, token, created_by, expires_at) VALUES (?,?,?,?,?,?,?)').run(
    randomUUID(), req.user.orgId, email.toLowerCase(), role, token, req.user.userId, expiresAt
  );
  res.status(201).json({ token, inviteUrl: `/join?token=${token}`, expiresAt });
});

// DELETE /api/orgs/invites/:id (admin only)
router.delete('/invites/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM org_invites WHERE id = ? AND org_id = ?').run(req.params.id, req.user.orgId);
  res.status(204).send();
});

// PUT /api/orgs/members/:userId/role (admin only)
router.put('/members/:userId/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) { res.status(400).json({ error: 'Invalid role' }); return; }
  if (req.params.userId === req.user.userId) { res.status(400).json({ error: 'Cannot change your own role' }); return; }
  const user = db.prepare('SELECT id FROM users WHERE id = ? AND org_id = ?').get(req.params.userId, req.user.orgId);
  if (!user) { res.status(404).json({ error: 'Member not found' }); return; }
  db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, new Date().toISOString(), req.params.userId);
  res.json({ ok: true });
});

// DELETE /api/orgs/members/:userId (admin only)
router.delete('/members/:userId', requireAdmin, (req, res) => {
  if (req.params.userId === req.user.userId) { res.status(400).json({ error: 'Cannot remove yourself' }); return; }
  const user = db.prepare('SELECT id FROM users WHERE id = ? AND org_id = ?').get(req.params.userId, req.user.orgId);
  if (!user) { res.status(404).json({ error: 'Member not found' }); return; }
  db.prepare('DELETE FROM users WHERE id = ? AND org_id = ?').run(req.params.userId, req.user.orgId);
  res.status(204).send();
});

// GET /api/orgs/usage (monthly usage detail)
router.get('/usage', (req, res) => {
  const start = new Date();
  start.setDate(1); start.setHours(0, 0, 0, 0);
  const logs = db.prepare(
    'SELECT action, COUNT(*) as count FROM usage_logs WHERE org_id = ? AND created_at >= ? GROUP BY action'
  ).all(req.user.orgId, start.toISOString());
  const total = getMonthlyUsage(req.user.orgId);
  const org = db.prepare('SELECT plan, ai_calls_limit FROM orgs WHERE id = ?').get(req.user.orgId) as any;
  const limits = PLAN_LIMITS[org.plan] ?? PLAN_LIMITS.free;
  res.json({ total, breakdown: logs, limit: limits.aiCalls, plan: org.plan });
});

export default router;
