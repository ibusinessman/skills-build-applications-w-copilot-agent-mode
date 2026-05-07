import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, UserCog, X, Shield } from 'lucide-react';

interface Person {
  id: string;
  name: string;
  role: string;
  clearance: string;
  unit: string;
  status: string;
}

const CLEARANCE_COLORS: Record<string, string> = {
  Alpha: '#f59e0b',
  Beta: '#6366f1',
  Gamma: '#10b981',
  Delta: '#9ca3af',
};

export function PersonnelView() {
  const [personnel, setPersonnel] = useState<Person[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState({ name: '', role: '', clearance: 'Gamma', unit: '', status: 'active' });

  useEffect(() => {
    fetch('/api/personnel').then(r => r.json()).then(setPersonnel).catch(console.error);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', role: '', clearance: 'Gamma', unit: '', status: 'active' });
    setShowForm(true);
  };

  const openEdit = (p: Person) => {
    setEditing(p);
    setForm({ name: p.name, role: p.role, clearance: p.clearance, unit: p.unit, status: p.status });
    setShowForm(true);
  };

  const save = async () => {
    if (editing) {
      const res = await fetch(`/api/personnel/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const updated = await res.json();
      setPersonnel(prev => prev.map(p => p.id === updated.id ? updated : p));
    } else {
      const res = await fetch('/api/personnel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const created = await res.json();
      setPersonnel(prev => [...prev, created]);
    }
    setShowForm(false);
  };

  const remove = async (id: string) => {
    await fetch(`/api/personnel/${id}`, { method: 'DELETE' });
    setPersonnel(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Personnel</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Identity and access management</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus className="w-4 h-4" /> Add Personnel
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="rounded-xl p-6 w-full max-w-md space-y-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {editing ? 'Edit Personnel' : 'Add Personnel'}
                </h2>
                <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              {[
                { label: 'Name', key: 'name', placeholder: 'Full name' },
                { label: 'Role', key: 'role', placeholder: 'Job title' },
                { label: 'Unit', key: 'unit', placeholder: 'Team unit' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
              {[
                { label: 'Clearance Level', key: 'clearance', options: ['Alpha', 'Beta', 'Gamma', 'Delta'] },
                { label: 'Status', key: 'status', options: ['active', 'inactive', 'on-leave'] },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                  <select
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={save} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent)', color: '#fff' }}>Save</button>
                <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              {['Name', 'Role', 'Unit', 'Clearance', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {personnel.map(person => (
                <motion.tr
                  key={person.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  className="hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserCog className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{person.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{person.role}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{person.unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" style={{ color: CLEARANCE_COLORS[person.clearance] || 'var(--text-muted)' }} />
                      <span
                        className="text-xs font-medium"
                        style={{ color: CLEARANCE_COLORS[person.clearance] || 'var(--text-muted)' }}
                      >
                        {person.clearance}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: person.status === 'active' ? 'var(--success)22' : 'var(--bg-tertiary)',
                        color: person.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                      }}
                    >
                      {person.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(person)} style={{ color: 'var(--text-muted)' }}><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(person.id)} style={{ color: 'var(--text-muted)' }}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {personnel.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No personnel yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
