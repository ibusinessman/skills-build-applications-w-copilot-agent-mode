import { motion } from 'motion/react';
import { BookOpen, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LedgerEntry {
  rank: number;
  name: string;
  unit: string;
  revenue: number;
  growth: number;
  deals: number;
  score: number;
}

const MOCK_DATA: LedgerEntry[] = [
  { rank: 1, name: 'Sarah Chen', unit: 'Vanguard', revenue: 487000, growth: 23.4, deals: 18, score: 97 },
  { rank: 2, name: 'Marcus Webb', unit: 'Nexus', revenue: 412000, growth: 18.7, deals: 15, score: 92 },
  { rank: 3, name: 'Jordan Kim', unit: 'Vanguard', revenue: 356000, growth: 12.1, deals: 14, score: 85 },
  { rank: 4, name: 'Alex Rivera', unit: 'Nexus', revenue: 298000, growth: -3.2, deals: 11, score: 76 },
  { rank: 5, name: 'Taylor Moss', unit: 'Vanguard', revenue: 245000, growth: 8.9, deals: 10, score: 71 },
  { rank: 6, name: 'Casey Park', unit: 'Nexus', revenue: 198000, growth: 5.6, deals: 8, score: 64 },
  { rank: 7, name: 'Drew Santos', unit: 'Vanguard', revenue: 176000, growth: -1.4, deals: 7, score: 58 },
  { rank: 8, name: 'Morgan Lee', unit: 'Nexus', revenue: 143000, growth: 2.3, deals: 6, score: 51 },
];

const RANK_COLORS: Record<number, string> = {
  1: '#f59e0b',
  2: '#9ca3af',
  3: '#cd7c2f',
};

export function LedgerView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Performance Ledger</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Ranked performance across all revenue personnel
        </p>
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-4">
        {MOCK_DATA.slice(0, 3).map((entry, i) => (
          <motion.div
            key={entry.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl p-5 text-center"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${RANK_COLORS[entry.rank]}44`,
              boxShadow: `0 0 20px ${RANK_COLORS[entry.rank]}22`,
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-2"
              style={{ background: RANK_COLORS[entry.rank] + '22', color: RANK_COLORS[entry.rank] }}
            >
              {entry.rank}
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{entry.name}</p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{entry.unit}</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              ${entry.revenue.toLocaleString()}
            </p>
            <p className="text-xs mt-1" style={{ color: entry.growth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {entry.growth >= 0 ? '+' : ''}{entry.growth}% growth
            </p>
          </motion.div>
        ))}
      </div>

      {/* Full table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <BookOpen className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Full Rankings</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              {['Rank', 'Name', 'Unit', 'Revenue', 'Growth', 'Deals', 'Score'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_DATA.map((entry, i) => (
              <motion.tr
                key={entry.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ borderBottom: '1px solid var(--border-color)' }}
                className="hover:bg-white/3 transition-colors"
              >
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-bold"
                    style={{ color: RANK_COLORS[entry.rank] || 'var(--text-muted)' }}
                  >
                    #{entry.rank}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-primary)' }}>
                  {entry.name}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.unit}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-primary)' }}>
                  ${entry.revenue.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-xs" style={{
                    color: entry.growth > 0 ? 'var(--success)' : entry.growth < 0 ? 'var(--danger)' : 'var(--text-muted)'
                  }}>
                    {entry.growth > 0 ? <TrendingUp className="w-3 h-3" /> : entry.growth < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {entry.growth > 0 ? '+' : ''}{entry.growth}%
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.deals}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)', maxWidth: '60px' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${entry.score}%`,
                          background: entry.score >= 80 ? 'var(--success)' : 'var(--warning)',
                        }}
                      />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.score}</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
