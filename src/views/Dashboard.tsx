import { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { HealthGauge } from '@/components/HealthGauge';
import { SatorSquare } from '@/components/SatorSquare';
import { useSystemIntegrity } from '@/hooks/useSystemIntegrity';
import { SATORLayer } from '@/types';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

const RADAR_DATA = [
  { layer: SATORLayer.Strategy, score: 82, fullMark: 100 },
  { layer: SATORLayer.Architecture, score: 74, fullMark: 100 },
  { layer: SATORLayer.Tenet, score: 91, fullMark: 100 },
  { layer: SATORLayer.Output, score: 68, fullMark: 100 },
  { layer: SATORLayer.Rotation, score: 79, fullMark: 100 },
];

const ROTAS_DATA = [
  { layer: 'Rotation', score: 79, fullMark: 100 },
  { layer: 'Output', score: 68, fullMark: 100 },
  { layer: 'Tenet', score: 91, fullMark: 100 },
  { layer: 'Architecture', score: 74, fullMark: 100 },
  { layer: 'Strategy', score: 82, fullMark: 100 },
];

export function DashboardView() {
  const status = useSystemIntegrity();
  const [perspective, setPerspective] = useState<'SATOR' | 'ROTAS'>('SATOR');
  const radarData = perspective === 'SATOR' ? RADAR_DATA : ROTAS_DATA;

  const metrics = [
    { label: 'Active Operations', value: '12', trend: '+3', up: true },
    { label: 'Growth Drills', value: '5', trend: '+1', up: true },
    { label: 'Revenue Units', value: '4', trend: '0', up: true },
    { label: 'Tenet Compliance', value: '94%', trend: '+2%', up: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            System Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Real-time SATOR governance overview
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--success)' }}>
          <Activity className="w-3 h-3" />
          Live
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{m.value}</p>
            <p className="text-xs mt-1 flex items-center gap-1"
              style={{ color: m.up ? 'var(--success)' : 'var(--danger)' }}>
              {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {m.trend} this week
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health gauge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl p-6 flex flex-col items-center gap-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            System Integrity
          </h2>
          <HealthGauge score={status.healthScore} />
          <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            <p>Last updated: {new Date(status.timestamp).toLocaleTimeString()}</p>
            <p className="mt-1" style={{ color: status.delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {status.delta >= 0 ? '▲' : '▼'} {Math.abs(status.delta).toFixed(1)} since last check
            </p>
          </div>
        </motion.div>

        {/* Radar chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Layer Analysis
            </h2>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              {(['SATOR', 'ROTAS'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPerspective(p)}
                  className="px-3 py-1 text-xs font-mono transition-colors"
                  style={{
                    background: perspective === p ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: perspective === p ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border-color)" />
              <PolarAngleAxis
                dataKey="layer"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="var(--accent)"
                fill="var(--accent)"
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* SATOR Square */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl p-6 flex flex-col items-center gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          SATOR Magic Square — The Recursive Truth
        </h2>
        <SatorSquare />
        <p className="text-xs text-center max-w-md" style={{ color: 'var(--text-muted)' }}>
          The SATOR square reads the same forwards, backwards, up, and down — a symbol of self-referential systemic truth.
        </p>
      </motion.div>
    </div>
  );
}
