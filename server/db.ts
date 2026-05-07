import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const db = new Database(path.join(__dirname, '..', 'sator.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS orgs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    ai_calls_limit INTEGER NOT NULL DEFAULT 50,
    gemini_api_key TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS org_invites (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    token TEXT UNIQUE NOT NULL,
    created_by TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    accepted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planning',
    market TEXT NOT NULL DEFAULT '',
    revenue INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS drills (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'revenue',
    target INTEGER NOT NULL DEFAULT 0,
    current INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lead TEXT NOT NULL DEFAULT '',
    headcount INTEGER NOT NULL DEFAULT 0,
    focus TEXT NOT NULL DEFAULT '',
    performance INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS personnel (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '',
    clearance TEXT NOT NULL DEFAULT 'Delta',
    unit TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export const PLAN_LIMITS: Record<string, { aiCalls: number; users: number; name: string; price: number }> = {
  free:       { name: 'Free',       price: 0,   aiCalls: 50,   users: 3  },
  pro:        { name: 'Pro',        price: 29,  aiCalls: 1000, users: 25 },
  enterprise: { name: 'Enterprise', price: 99,  aiCalls: -1,   users: -1 },
};

export function getMonthlyUsage(orgId: string): number {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const row = db.prepare(
    'SELECT COUNT(*) as count FROM usage_logs WHERE org_id = ? AND created_at >= ?'
  ).get(orgId, start.toISOString()) as { count: number };
  return row.count;
}

export function canMakeAICall(orgId: string): boolean {
  const org = db.prepare('SELECT plan, ai_calls_limit FROM orgs WHERE id = ?').get(orgId) as any;
  if (!org) return false;
  if (org.ai_calls_limit === -1) return true;
  return getMonthlyUsage(orgId) < org.ai_calls_limit;
}

export function trackUsage(orgId: string, userId: string, action: string) {
  db.prepare(
    'INSERT INTO usage_logs (id, org_id, user_id, action, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(randomUUID(), orgId, userId, action, new Date().toISOString());
}

// Seed a demo org if DB is empty
const orgCount = (db.prepare('SELECT COUNT(*) as c FROM orgs').get() as any).c;
if (orgCount === 0) {
  const orgId = randomUUID();
  const userId = randomUUID();
  const now = new Date().toISOString();
  const hash = bcrypt.hashSync('demo1234', 10);

  db.prepare('INSERT INTO orgs (id, name, slug, plan, ai_calls_limit, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    orgId, 'Demo Corp', 'demo-corp', 'pro', 1000, now
  );
  db.prepare('INSERT INTO users (id, org_id, email, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    userId, orgId, 'demo@sator.ai', hash, 'Demo Admin', 'admin', now, now
  );

  // Seed some data
  const ops = [
    [randomUUID(), orgId, 'Alpha Expansion', 'active', 'North America', 125000, now],
    [randomUUID(), orgId, 'Beta Penetration', 'planning', 'Europe', 87000, now],
  ];
  ops.forEach(o => db.prepare('INSERT INTO operations (id, org_id, name, status, market, revenue, created_at) VALUES (?,?,?,?,?,?,?)').run(...o));

  const drills = [
    [randomUUID(), orgId, 'Q4 Revenue Sprint', 'revenue', 500000, 312000, 'active'],
    [randomUUID(), orgId, 'Market Share Drill', 'market', 25, 18, 'active'],
  ];
  drills.forEach(d => db.prepare('INSERT INTO drills (id, org_id, name, type, target, current, status) VALUES (?,?,?,?,?,?,?)').run(...d));

  const units2 = [
    [randomUUID(), orgId, 'Vanguard Unit', 'Sarah Chen', 12, 'Enterprise', 94],
    [randomUUID(), orgId, 'Nexus Unit', 'Marcus Webb', 8, 'SMB', 87],
  ];
  units2.forEach(u => db.prepare('INSERT INTO units (id, org_id, name, lead, headcount, focus, performance) VALUES (?,?,?,?,?,?,?)').run(...u));

  db.prepare('INSERT INTO personnel (id, org_id, name, role, clearance, unit, status) VALUES (?,?,?,?,?,?,?)').run(
    randomUUID(), orgId, 'Sarah Chen', 'Unit Lead', 'Alpha', 'Vanguard', 'active'
  );
  db.prepare('INSERT INTO personnel (id, org_id, name, role, clearance, unit, status) VALUES (?,?,?,?,?,?,?)').run(
    randomUUID(), orgId, 'Marcus Webb', 'Unit Lead', 'Alpha', 'Nexus', 'active'
  );

  console.log('🌱 Demo org seeded — login: demo@sator.ai / demo1234');
}
