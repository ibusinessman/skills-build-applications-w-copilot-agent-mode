import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';
import { requireAuth, setAuthCookie, clearAuthCookie, hashPassword, verifyPassword } from '../auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, orgName } = req.body;
  if (!name || !email || !password || !orgName) {
    res.status(400).json({ error: 'name, email, password, orgName are required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const orgId = randomUUID();
  const userId = randomUUID();
  const now = new Date().toISOString();
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + orgId.slice(0, 6);
  const hash = await hashPassword(password);

  db.prepare('INSERT INTO orgs (id, name, slug, plan, ai_calls_limit, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    orgId, orgName, slug, 'free', 50, now
  );
  db.prepare('INSERT INTO users (id, org_id, email, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    userId, orgId, email.toLowerCase(), hash, name, 'admin', now, now
  );

  const org = db.prepare('SELECT * FROM orgs WHERE id = ?').get(orgId) as any;
  const payload = { userId, orgId, role: 'admin', email: email.toLowerCase(), name };
  setAuthCookie(res, payload);
  res.status(201).json({ user: { id: userId, name, email, role: 'admin' }, org });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const org = db.prepare('SELECT * FROM orgs WHERE id = ?').get(user.org_id) as any;
  const payload = { userId: user.id, orgId: user.org_id, role: user.role, email: user.email, name: user.name };
  setAuthCookie(res, payload);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, org });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, org_id, created_at FROM users WHERE id = ?').get(req.user.userId) as any;
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const org = db.prepare('SELECT * FROM orgs WHERE id = ?').get(user.org_id) as any;
  res.json({ user, org });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId) as any;
  if (!user) { res.status(404).json({ error: 'Not found' }); return; }

  const updates: Record<string, string> = { updated_at: new Date().toISOString() };

  if (name) updates.name = name;
  if (email) {
    const conflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, user.id);
    if (conflict) { res.status(409).json({ error: 'Email taken' }); return; }
    updates.email = email.toLowerCase();
  }
  if (newPassword) {
    if (!currentPassword) { res.status(400).json({ error: 'Current password required' }); return; }
    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) { res.status(401).json({ error: 'Current password incorrect' }); return; }
    if (newPassword.length < 8) { res.status(400).json({ error: 'New password too short' }); return; }
    updates.password_hash = await hashPassword(newPassword);
  }

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), user.id);

  const updated = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(user.id);
  res.json(updated);
});

// GET /api/auth/accept-invite
router.get('/accept-invite', (req, res) => {
  const { token } = req.query as { token: string };
  const invite = db.prepare('SELECT * FROM org_invites WHERE token = ? AND accepted_at IS NULL').get(token) as any;
  if (!invite) { res.status(404).json({ error: 'Invalid or expired invite' }); return; }
  if (new Date(invite.expires_at) < new Date()) { res.status(410).json({ error: 'Invite expired' }); return; }
  const org = db.prepare('SELECT id, name FROM orgs WHERE id = ?').get(invite.org_id) as any;
  res.json({ email: invite.email, role: invite.role, org });
});

// POST /api/auth/accept-invite
router.post('/accept-invite', async (req, res) => {
  const { token, name, password } = req.body;
  const invite = db.prepare('SELECT * FROM org_invites WHERE token = ? AND accepted_at IS NULL').get(token) as any;
  if (!invite) { res.status(404).json({ error: 'Invalid invite' }); return; }
  if (new Date(invite.expires_at) < new Date()) { res.status(410).json({ error: 'Invite expired' }); return; }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(invite.email);
  if (existing) { res.status(409).json({ error: 'Email already registered' }); return; }

  const userId = randomUUID();
  const now = new Date().toISOString();
  const hash = await hashPassword(password);

  db.prepare('INSERT INTO users (id, org_id, email, password_hash, name, role, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)').run(
    userId, invite.org_id, invite.email, hash, name, invite.role, now, now
  );
  db.prepare('UPDATE org_invites SET accepted_at = ? WHERE id = ?').run(now, invite.id);

  const org = db.prepare('SELECT * FROM orgs WHERE id = ?').get(invite.org_id) as any;
  const payload = { userId, orgId: invite.org_id, role: invite.role, email: invite.email, name };
  setAuthCookie(res, payload);
  res.status(201).json({ user: { id: userId, name, email: invite.email, role: invite.role }, org });
});

export default router;
