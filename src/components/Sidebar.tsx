import {
  LayoutDashboard,
  ClipboardCheck,
  Zap,
  Target,
  Users,
  BookOpen,
  Bot,
  FlaskConical,
  GitBranch,
  UserCog,
  ScrollText,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewKey =
  | 'dashboard'
  | 'audit'
  | 'operations'
  | 'drills'
  | 'units'
  | 'ledger'
  | 'agents'
  | 'simulation'
  | 'visualizer'
  | 'personnel'
  | 'logs';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'audit', label: 'SATOR Audit', icon: ClipboardCheck },
  { key: 'operations', label: 'Operations', icon: Zap },
  { key: 'drills', label: 'Growth Drills', icon: Target },
  { key: 'units', label: 'Revenue Units', icon: Users },
  { key: 'ledger', label: 'Ledger', icon: BookOpen },
  { key: 'agents', label: 'AI Agents', icon: Bot },
  { key: 'simulation', label: 'Simulation', icon: FlaskConical },
  { key: 'visualizer', label: 'Visualizer', icon: GitBranch },
  { key: 'personnel', label: 'Personnel', icon: UserCog },
  { key: 'logs', label: 'System Logs', icon: ScrollText },
];

interface SidebarProps {
  activeView: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside
      className="flex flex-col w-64 min-h-screen border-r"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          S
        </div>
        <div>
          <p className="font-bold text-sm tracking-widest" style={{ color: 'var(--text-primary)' }}>
            SATOR
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Governance Engine
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = activeView === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group',
                isActive ? 'glow-border' : 'hover:bg-white/5'
              )}
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(99,102,241,0.08)' : undefined,
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3 border-t text-xs"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
      >
        SATOR v1.0 · Fractal Engine
      </div>
    </aside>
  );
}
