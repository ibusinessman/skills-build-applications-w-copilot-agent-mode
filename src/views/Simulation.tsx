import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { runSATORSimulation } from '@/services/geminiService';
import { SimulationResult } from '@/types';
import { FlaskConical, Loader2, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';

const PRESET_SCENARIOS = [
  { label: 'Market Collapse', value: 'Sudden 40% market contraction across all primary revenue segments' },
  { label: 'Key Man Risk', value: 'Loss of 3 senior leadership positions simultaneously' },
  { label: 'Regulatory Shock', value: 'New compliance regime requiring 60-day full operational overhaul' },
  { label: 'Competitive Disruption', value: 'Well-funded competitor enters market with 50% price undercut' },
  { label: 'Tech Failure', value: 'Core infrastructure outage lasting 72 hours affecting all customers' },
  { label: 'Supply Chain Break', value: 'Primary vendor insolvency with no immediate substitute available' },
];

function StabilityBar({ value }: { value: number }) {
  const color = value >= 70 ? 'var(--success)' : value >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        <span>System Stability</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function SimulationView() {
  const [scenario, setScenario] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<SimulationResult[]>([]);

  const run = async () => {
    if (!scenario.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await runSATORSimulation(scenario, customContext || undefined);
      setResult(res);
      setHistory(prev => [res, ...prev.slice(0, 4)]);
    } catch (e) {
      setError('Simulation failed. Check your API key.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Fractal Stress Simulation
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Test system resilience through recursive SATOR scenario analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div
          className="rounded-xl p-5 space-y-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Preset Scenarios
          </h2>
          <div className="space-y-1.5">
            {PRESET_SCENARIOS.map(ps => (
              <button
                key={ps.label}
                onClick={() => setScenario(ps.value)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-all hover:bg-white/5"
                style={{
                  color: scenario === ps.value ? 'var(--accent)' : 'var(--text-secondary)',
                  background: scenario === ps.value ? 'rgba(99,102,241,0.08)' : undefined,
                  border: `1px solid ${scenario === ps.value ? 'var(--accent)' : 'var(--border-color)'}`,
                }}
              >
                <ChevronRight className="w-3 h-3 shrink-0" />
                {ps.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
              Custom Scenario
            </label>
            <textarea
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              placeholder="Describe your stress scenario…"
              className="w-full rounded-lg p-2.5 text-xs resize-none outline-none"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                minHeight: '80px',
              }}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
              Additional Context (optional)
            </label>
            <textarea
              value={customContext}
              onChange={e => setCustomContext(e.target.value)}
              placeholder="Company size, industry, constraints…"
              className="w-full rounded-lg p-2.5 text-xs resize-none outline-none"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                minHeight: '60px',
              }}
            />
          </div>

          <button
            onClick={run}
            disabled={loading || !scenario.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            {loading ? 'Simulating…' : 'Run Simulation'}
          </button>

          {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Stats */}
                <div
                  className="rounded-xl p-5 grid grid-cols-3 gap-4"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                >
                  {[
                    { label: 'Iterations', value: result.iterations.toLocaleString() },
                    { label: 'Fractal Depth', value: `${result.fractalDepth}/10` },
                    { label: 'Branching Factor', value: `${result.branchingFactor}x` },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Stability */}
                <div
                  className="rounded-xl p-5"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                >
                  <StabilityBar value={result.stability} />
                </div>

                {/* Collapse points */}
                {result.collapsePoints.length > 0 && (
                  <div
                    className="rounded-xl p-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4" style={{ color: 'var(--danger)' }} />
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Collapse Points
                      </h3>
                    </div>
                    <ul className="space-y-1.5">
                      {result.collapsePoints.map((cp, i) => (
                        <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-primary)' }}>
                          <span style={{ color: 'var(--danger)' }}>•</span>
                          {cp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Insights */}
                {result.insights.length > 0 && (
                  <div
                    className="rounded-xl p-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Insights
                      </h3>
                    </div>
                    <ul className="space-y-1.5">
                      {result.insights.map((insight, i) => (
                        <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-primary)' }}>
                          <span style={{ color: 'var(--warning)' }}>→</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendation */}
                {result.recommendation && (
                  <div
                    className="rounded-xl p-5"
                    style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.3)' }}
                  >
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>
                      Primary Recommendation
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {result.recommendation}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {!result && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-64 flex items-center justify-center rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Select a scenario and run the simulation
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          {history.length > 1 && (
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                Recent Simulations
              </h3>
              <div className="space-y-2">
                {history.slice(1).map(h => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between text-xs px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5"
                    style={{ background: 'var(--bg-tertiary)' }}
                    onClick={() => setResult(h)}
                  >
                    <span className="truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
                      {h.scenario.slice(0, 50)}…
                    </span>
                    <span className="ml-3 shrink-0" style={{
                      color: h.stability >= 70 ? 'var(--success)' : h.stability >= 40 ? 'var(--warning)' : 'var(--danger)'
                    }}>
                      {h.stability}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
