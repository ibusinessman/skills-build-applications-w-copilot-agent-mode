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
  Settings,
  CreditCard,
  LogOut,
  Crown,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

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
  | 'logs'
  | 'settings'
  | 'billing'
  | 'whitepaper';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',  label: 'Dashboard',     icon: LayoutDashboard, group: 'Core' },
  { key: 'audit',      label: 'SATOR Audit',    icon: ClipboardCheck,  group: 'Core' },
  { key: 'agents',     label: 'AI Agents',      icon: Bot,             group: 'Core' },
  { key: 'simulation', label: 'Simulation',     icon: FlaskConical,    group: 'Core' },
  { key: 'visualizer', label: 'Visualizer',     icon: GitBranch,       group: 'Core' },
  { key: 'operations', label: 'Operations',     icon: Zap,             group: 'Revenue' },
  { key: 'drills',     label: 'Growth Drills',  icon: Target,          group: 'Revenue' },
  { key: 'units',      label: 'Revenue Units',  icon: Users,           group: 'Revenue' },
  { key: 'ledger',     label: 'Ledger',         icon: BookOpen,        group: 'Revenue' },
  { key: 'personnel',  label: 'Personnel',      icon: UserCog,         group: 'Revenue' },
  { key: 'logs',        label: 'System Logs',    icon: ScrollText,  group: 'System' },
  { key: 'whitepaper',  label: 'White Paper',    icon: FileText,    group: 'System' },
  { key: 'settings',    label: 'Settings',       icon: Settings,    group: 'System' },
  { key: 'billing',     label: 'Plans & Billing', icon: CreditCard, group: 'System' },
];

const GROUPS = ['Core', 'Revenue', 'System'];

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  free:       { label: 'Free',       color: '#9ca3af' },
  pro:        { label: 'Pro',        color: '#f59e0b' },
  enterprise: { label: 'Enterprise', color: '#6366f1' },
};

interface SidebarProps {
  activeView: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const { user, org, logout } = useAuth();
  const plan = org?.plan ?? 'free';
  const badge = PLAN_BADGE[plan] ?? PLAN_BADGE.free;

  return (
    <aside
      className="flex flex-col w-64 min-h-screen border-r shrink-0"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'var(--accent)', color: '#fff' }}>
          S
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm tracking-widest" style={{ color: 'var(--text-primary)' }}>SATOR</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{org?.name ?? 'Loading…'}</p>
        </div>
        <span className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0" style={{ background: badge.color + '22', color: badge.color }}>
          {badge.label}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {GROUPS.map(group => {
          const items = NAV_ITEMS.filter(n => n.group === group);
          return (
            <div key={group}>
              <p className="text-xs font-semibold px-3 mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map(({ key, label, icon: Icon }) => {
                  const isActive = activeView === key;
                  return (
                    <button
                      key={key}
                      onClick={() => onNavigate(key)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
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
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t px-3 py-3 space-y-1" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'var(--accent)22', color: 'var(--accent)' }}
          >
            {user?.name?.[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-xs truncate flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              {user?.role === 'admin' && <Crown className="w-2.5 h-2.5" />}
              {user?.role}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors shrink-0"
            style={{ color: 'var(--text-muted)' }}
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
