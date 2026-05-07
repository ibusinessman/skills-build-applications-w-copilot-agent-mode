import { Router } from 'express';
import { db, PLAN_LIMITS, getMonthlyUsage } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/billing/plans
router.get('/plans', (_req, res) => {
  const plans = Object.entries(PLAN_LIMITS).map(([id, plan]) => ({
    id,
    ...plan,
    features: PLAN_FEATURES[id] ?? [],
  }));
  res.json(plans);
});

// GET /api/billing/current
router.get('/current', (req, res) => {
  const org = db.prepare('SELECT id, name, plan, ai_calls_limit FROM orgs WHERE id = ?').get(req.user.orgId) as any;
  if (!org) { res.status(404).json({ error: 'Org not found' }); return; }
  const limits = PLAN_LIMITS[org.plan] ?? PLAN_LIMITS.free;
  const usage = getMonthlyUsage(org.id);
  const memberCount = (db.prepare('SELECT COUNT(*) as c FROM users WHERE org_id = ?').get(org.id) as any).c;
  res.json({ plan: org.plan, limits, usage, memberCount });
});

// POST /api/billing/upgrade (mock — in production connect Stripe)
router.post('/upgrade', requireAdmin, (req, res) => {
  const { plan } = req.body;
  if (!PLAN_LIMITS[plan]) { res.status(400).json({ error: 'Invalid plan' }); return; }

  const limits = PLAN_LIMITS[plan];
  db.prepare('UPDATE orgs SET plan = ?, ai_calls_limit = ? WHERE id = ?').run(
    plan, limits.aiCalls, req.user.orgId
  );
  res.json({
    ok: true,
    plan,
    message: plan === 'free'
      ? 'Downgraded to Free plan.'
      : `Upgraded to ${limits.name} plan. In production, Stripe would process payment here.`,
  });
});

// PUT /api/billing/api-key (Enterprise: set custom Gemini key)
router.put('/api-key', requireAdmin, (req, res) => {
  const { geminiApiKey } = req.body;
  const org = db.prepare('SELECT plan FROM orgs WHERE id = ?').get(req.user.orgId) as any;
  if (org.plan !== 'enterprise') {
    res.status(403).json({ error: 'Custom API keys require the Enterprise plan' });
    return;
  }
  db.prepare('UPDATE orgs SET gemini_api_key = ? WHERE id = ?').run(geminiApiKey || null, req.user.orgId);
  res.json({ ok: true });
});

// GET /api/billing/api-key-status
router.get('/api-key-status', requireAdmin, (req, res) => {
  const org = db.prepare('SELECT plan, gemini_api_key FROM orgs WHERE id = ?').get(req.user.orgId) as any;
  res.json({ plan: org.plan, hasCustomKey: !!org.gemini_api_key });
});

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    '50 AI calls / month',
    'Up to 3 team members',
    'SATOR Audit Engine',
    'Operations & Drills',
    'Fractal Visualizer',
    'System Logs',
  ],
  pro: [
    '1,000 AI calls / month',
    'Up to 25 team members',
    'Everything in Free',
    'All 3 AI Agents',
    'Fractal Stress Simulation',
    'PDF & JSON export',
    'Team invite management',
    'Priority support',
  ],
  enterprise: [
    'Unlimited AI calls',
    'Unlimited team members',
    'Everything in Pro',
    'Bring your own Gemini API key',
    'Usage analytics dashboard',
    'Role-based access control',
    'SLA & dedicated support',
  ],
};

export default router;
