import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { User, Users, Shield, Copy, Trash2, Check, Loader2, Plus, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'team';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expires_at: string;
}

const inputStyle = {
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
} as const;

export function SettingsView() {
  const { user, org, updateProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  // Profile state
  const [profileForm, setProfileForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', currentPassword: '', newPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', ok: true });

  // Team state
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ url?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (tab === 'team') loadTeam();
  }, [tab]);

  const loadTeam = async () => {
    const res = await fetch('/api/orgs/members', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members);
      setInvites(data.invites);
    }
  };

  const saveProfile = async () => {
    setProfileLoading(true);
    setProfileMsg({ text: '', ok: true });
    try {
      await updateProfile(profileForm);
      setProfileMsg({ text: 'Profile updated.', ok: true });
      setProfileForm(p => ({ ...p, currentPassword: '', newPassword: '' }));
    } catch (e: any) {
      setProfileMsg({ text: e.message, ok: false });
    } finally {
      setProfileLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteResult(null);
    const res = await fetch('/api/orgs/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    if (res.ok) {
      setInviteResult({ url: window.location.origin + '/join?token=' + data.token + '&email=' + encodeURIComponent(inviteEmail) });
      setInviteEmail('');
      loadTeam();
    } else {
      setInviteResult({ error: data.error });
    }
    setInviting(false);
  };

  const copyInvite = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeInvite = async (id: string) => {
    await fetch(`/api/orgs/invites/${id}`, { method: 'DELETE', credentials: 'include' });
    loadTeam();
  };

  const removeMember = async (id: string) => {
    if (!confirm('Remove this member?')) return;
    await fetch(`/api/orgs/members/${id}`, { method: 'DELETE', credentials: 'include' });
    loadTeam();
  };

  const changeRole = async (id: string, role: string) => {
    await fetch(`/api/orgs/members/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    loadTeam();
  };

  const TABS = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'team' as Tab, label: 'Team', icon: Users },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {org?.name} · {org?.plan?.toUpperCase()} plan
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', width: 'fit-content' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all')}
            style={{
              background: tab === id ? 'var(--accent)' : 'transparent',
              color: tab === id ? '#fff' : 'var(--text-muted)',
            }}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl p-6 space-y-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Account Details</h2>

          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your name' },
            { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@company.com' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
              <input
                type={f.type}
                value={profileForm[f.key as keyof typeof profileForm]}
                onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          ))}

          <div className="pt-4 border-t space-y-4" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Change Password</h3>
            {[
              { label: 'Current Password', key: 'currentPassword' },
              { label: 'New Password', key: 'newPassword' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                <input
                  type="password"
                  value={profileForm[f.key as keyof typeof profileForm]}
                  onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          {profileMsg.text && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{
              background: profileMsg.ok ? 'var(--success)22' : 'var(--danger)22',
              color: profileMsg.ok ? 'var(--success)' : 'var(--danger)',
            }}>
              {profileMsg.text}
            </p>
          )}

          <button
            onClick={saveProfile}
            disabled={profileLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Changes
          </button>
        </motion.div>
      )}

      {/* Team tab */}
      {tab === 'team' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Invite (admin only) */}
          {isAdmin && (
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Invite Member
              </h2>
              <div className="flex gap-2">
                <input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={sendInvite}
                  disabled={inviting || !inviteEmail}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Invite
                </button>
              </div>

              {inviteResult?.url && (
                <div className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <span className="flex-1 truncate font-mono" style={{ color: 'var(--text-secondary)' }}>{inviteResult.url}</span>
                  <button onClick={() => copyInvite(inviteResult.url!)} style={{ color: 'var(--accent)' }}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
              {inviteResult?.error && (
                <p className="text-xs" style={{ color: 'var(--danger)' }}>{inviteResult.error}</p>
              )}
            </div>
          )}

          {/* Members list */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Members ({members.length})
              </h2>
            </div>
            {members.map(m => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--accent)22', color: 'var(--accent)' }}
                >
                  {m.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {m.name} {m.id === user?.id && <span style={{ color: 'var(--text-muted)' }}>(you)</span>}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{m.email}</p>
                </div>
                {isAdmin && m.id !== user?.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={e => changeRole(m.id, e.target.value)}
                      className="text-xs rounded px-2 py-1 outline-none"
                      style={inputStyle}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={() => removeMember(m.id)} style={{ color: 'var(--text-muted)' }}>
                      <Trash2 className="w-3.5 h-3.5 hover:text-red-400 transition-colors" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs" style={{ color: m.role === 'admin' ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {m.role === 'admin' && <Crown className="w-3 h-3" />}
                    {m.role}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pending invites */}
          {invites.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Pending Invites ({invites.length})
                </h2>
              </div>
              {invites.map(inv => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <Shield className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{inv.email}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {inv.role} · expires {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => removeInvite(inv.id)} style={{ color: 'var(--text-muted)' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
