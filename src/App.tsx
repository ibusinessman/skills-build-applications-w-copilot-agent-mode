import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Sidebar, ViewKey } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AuthView } from '@/views/Auth';
import { DashboardView } from '@/views/Dashboard';
import { AuditView } from '@/views/Audit';
import { AgentsView } from '@/views/Agents';
import { SimulationView } from '@/views/Simulation';
import { VisualizerView } from '@/views/Visualizer';
import { OperationsView } from '@/views/Operations';
import { DrillsView } from '@/views/Drills';
import { RevenueUnitsView } from '@/views/RevenueUnits';
import { LedgerView } from '@/views/Ledger';
import { PersonnelView } from '@/views/Personnel';
import { SettingsView } from '@/views/Settings';
import { BillingView } from '@/views/Billing';
import { ScrollText, Search, Download, Filter, Loader2 } from 'lucide-react';

// ── Inline Logs view ──────────────────────────────────────────────────────────
type LogLevel = 'info' | 'warn' | 'error' | 'debug';
interface LogEntry { id: string; timestamp: string; level: LogLevel; source: string; message: string; }

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: 'var(--accent)', warn: 'var(--warning)', error: 'var(--danger)', debug: 'var(--text-muted)',
};

function generateLogs(): LogEntry[] {
  const sources = ['SATOR Core', 'Audit Engine', 'WebSocket', 'Gemini API', 'Operations', 'Drills'];
  const messages: Record<LogLevel, string[]> = {
    info: ['System integrity check passed', 'WebSocket client connected', 'API key validated', 'Audit report generated', 'Operation created'],
    warn: ['Health score below threshold', 'WebSocket reconnection attempt', 'Layer score below minimum', 'Tenet compliance breach detected'],
    error: ['Gemini API rate limit exceeded', 'Failed to fetch /api/operations', 'WebSocket closed unexpectedly'],
    debug: ['Fractal tree depth set to 7', 'Radar chart data refreshed', 'Route changed: dashboard → audit'],
  };
  const levels: LogLevel[] = ['info','info','info','warn','debug','error','info','warn','debug'];
  return Array.from({ length: 40 }, (_, i) => {
    const level = levels[i % levels.length];
    return { id: String(i), timestamp: new Date(Date.now() - (40 - i) * 30000).toISOString(), level, source: sources[i % sources.length], message: messages[level][i % messages[level].length] };
  }).reverse();
}
const ALL_LOGS = generateLogs();

function LogsView() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const filtered = useMemo(() => ALL_LOGS.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase()) && !log.source.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [search, filter]);
  const exportLogs = () => {
    const text = filtered.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `sator-logs-${Date.now()}.txt`;
    a.click();
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>System Logs</h1><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Operational event stream</p></div>
        <button onClick={exportLogs} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs…" className="flex-1 bg-transparent text-xs outline-none" style={{ color: 'var(--text-primary)' }} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            {(['all','info','warn','error','debug'] as const).map(lvl => (
              <button key={lvl} onClick={() => setFilter(lvl)} className="px-2.5 py-1 text-xs transition-colors"
                style={{ background: filter === lvl ? (lvl === 'all' ? 'var(--accent)' : LEVEL_COLORS[lvl as LogLevel]) : 'var(--bg-tertiary)', color: filter === lvl ? '#fff' : 'var(--text-muted)' }}>
                {lvl}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{filtered.length} entries</span>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="font-mono text-xs">
          {filtered.map(log => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-2.5 border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
              <span className="shrink-0" style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="shrink-0 w-12 text-center rounded px-1" style={{ background: LEVEL_COLORS[log.level] + '22', color: LEVEL_COLORS[log.level] }}>{log.level}</span>
              <span className="shrink-0 w-28 truncate" style={{ color: 'var(--accent)' }}>{log.source}</span>
              <span style={{ color: 'var(--text-primary)' }}>{log.message}</span>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No matching entries</div>}
        </div>
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
const VIEW_COMPONENTS: Record<ViewKey, React.ComponentType> = {
  dashboard:  DashboardView,
  audit:      AuditView,
  agents:     AgentsView,
  simulation: SimulationView,
  visualizer: VisualizerView,
  operations: OperationsView,
  drills:     DrillsView,
  units:      RevenueUnitsView,
  ledger:     LedgerView,
  personnel:  PersonnelView,
  logs:       LogsView,
  settings:   SettingsView,
  billing:    BillingView,
};

function AppShell() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!user) return <AuthView />;

  const ActiveComponent = VIEW_COMPONENTS[activeView];

  return (
    <div className="flex min-h-screen">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="flex items-center justify-between px-6 py-3 border-b shrink-0"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              SATOR/{activeView.toUpperCase()}
            </span>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-primary)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
