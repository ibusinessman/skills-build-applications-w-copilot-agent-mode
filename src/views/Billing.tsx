import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { Check, Zap, Crown, Building2, Loader2, Key } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  aiCalls: number;
  users: number;
  features: string[];
}

interface BillingInfo {
  plan: string;
  limits: { aiCalls: number; users: number };
  usage: number;
  memberCount: number;
}

const PLAN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  free: Zap,
  pro: Crown,
  enterprise: Building2,
};

export function BillingView() {
  const { org, refreshOrg } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [upgrading, setUpgrading] = useState('');
  const [message, setMessage] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyMsg, setKeyMsg] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/billing/plans', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/billing/current', { credentials: 'include' }).then(r => r.json()),
    ]).then(([p, b]) => { setPlans(p); setBilling(b); });
  }, []);

  const changePlan = async (planId: string) => {
    setUpgrading(planId);
    setMessage('');
    const res = await fetch('/api/billing/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ plan: planId }),
    });
    const data = await res.json();
    setMessage(data.message ?? (res.ok ? 'Plan updated.' : data.error));
    if (res.ok) {
      await refreshOrg();
      const b = await fetch('/api/billing/current', { credentials: 'include' }).then(r => r.json());
      setBilling(b);
    }
    setUpgrading('');
  };

  const saveApiKey = async () => {
    setSavingKey(true);
    setKeyMsg('');
    const res = await fetch('/api/billing/api-key', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ geminiApiKey: apiKey }),
    });
    const data = await res.json();
    setKeyMsg(res.ok ? 'API key saved.' : data.error);
    setSavingKey(false);
  };

  const currentPlan = org?.plan ?? 'free';
  const usagePct = billing ? (billing.limits.aiCalls === -1 ? 0 : Math.min(100, (billing.usage / billing.limits.aiCalls) * 100)) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Plans & Billing</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage your subscription and usage</p>
      </div>

      {/* Usage bar */}
      {billing && (
        <div
          className="rounded-xl p-5 space-y-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              This Month's Usage
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent)22', color: 'var(--accent)' }}>
              {currentPlan.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
              <span>AI Calls</span>
              <span>
                {billing.usage.toLocaleString()} / {billing.limits.aiCalls === -1 ? '∞' : billing.limits.aiCalls.toLocaleString()}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: usagePct >= 90 ? 'var(--danger)' : usagePct >= 70 ? 'var(--warning)' : 'var(--success)' }}
                initial={{ width: 0 }}
                animate={{ width: billing.limits.aiCalls === -1 ? '5%' : `${usagePct}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Team Members</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {billing.memberCount} / {billing.limits.users === -1 ? '∞' : billing.limits.users}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Resets</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {message && (
        <p className="text-sm px-4 py-2 rounded-lg" style={{ background: 'var(--accent)22', color: 'var(--accent)' }}>
          {message}
        </p>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {plans.map((plan, i) => {
          const Icon = PLAN_ICONS[plan.id] ?? Zap;
          const isCurrentPlan = plan.id === currentPlan;
          const isUpgrade = ['free', 'pro', 'enterprise'].indexOf(plan.id) > ['free', 'pro', 'enterprise'].indexOf(currentPlan);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl p-6 flex flex-col"
              style={{
                background: isCurrentPlan ? 'rgba(99,102,241,0.06)' : 'var(--bg-card)',
                border: `1px solid ${isCurrentPlan ? 'var(--accent)' : 'var(--border-color)'}`,
                boxShadow: isCurrentPlan ? '0 0 20px rgba(99,102,241,0.15)' : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                </div>
                {isCurrentPlan && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: '#fff' }}>
                    Current
                  </span>
                )}
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </span>
                {plan.price > 0 && <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>/month</span>}
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrentPlan && changePlan(plan.id)}
                disabled={isCurrentPlan || upgrading === plan.id}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: isCurrentPlan ? 'var(--bg-tertiary)' : isUpgrade ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: isCurrentPlan ? 'var(--text-muted)' : isUpgrade ? '#fff' : 'var(--text-secondary)',
                  border: isCurrentPlan || isUpgrade ? undefined : '1px solid var(--border-color)',
                }}
              >
                {upgrading === plan.id && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCurrentPlan ? 'Current Plan' : isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Enterprise API key */}
      {currentPlan === 'enterprise' && (
        <div
          className="rounded-xl p-5 space-y-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Custom Gemini API Key</h2>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Enterprise plan: use your own Gemini API key for unlimited calls billed to your account.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIza…"
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={saveApiKey}
              disabled={savingKey || !apiKey}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {savingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save
            </button>
          </div>
          {keyMsg && <p className="text-xs" style={{ color: keyMsg.includes('saved') ? 'var(--success)' : 'var(--danger)' }}>{keyMsg}</p>}
        </div>
      )}

      {/* Note */}
      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        Demo mode: plan changes take effect immediately without real payment processing.
        In production, Stripe handles billing.
      </p>
    </div>
  );
}
