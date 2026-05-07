import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, Target, X } from 'lucide-react';

interface Drill {
  id: string;
  name: string;
  type: string;
  target: number;
  current: number;
  status: string;
}

export function DrillsView() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Drill | null>(null);
  const [form, setForm] = useState({ name: '', type: 'revenue', target: '', current: '', status: 'active' });

  useEffect(() => {
    fetch('/api/drills').then(r => r.json()).then(setDrills).catch(console.error);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'revenue', target: '', current: '', status: 'active' });
    setShowForm(true);
  };

  const openEdit = (d: Drill) => {
    setEditing(d);
    setForm({ name: d.name, type: d.type, target: String(d.target), current: String(d.current), status: d.status });
    setShowForm(true);
  };

  const save = async () => {
    const body = { ...form, target: Number(form.target), current: Number(form.current) };
    if (editing) {
      const res = await fetch(`/api/drills/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const updated = await res.json();
      setDrills(prev => prev.map(d => d.id === updated.id ? updated : d));
    } else {
      const res = await fetch('/api/drills', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const created = await res.json();
      setDrills(prev => [...prev, created]);
    }
    setShowForm(false);
  };

  const remove = async (id: string) => {
    await fetch(`/api/drills/${id}`, { method: 'DELETE' });
    setDrills(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Growth Drills</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Track growth drill progress</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus className="w-4 h-4" /> New Drill
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
                  {editing ? 'Edit Drill' : 'New Drill'}
                </h2>
                <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              {[
                { label: 'Name', key: 'name', placeholder: 'Drill name', type: 'text' },
                { label: 'Target', key: 'target', placeholder: '0', type: 'number' },
                { label: 'Current', key: 'current', placeholder: '0', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    type={f.type}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
              {[
                { label: 'Type', key: 'type', options: ['revenue', 'market', 'product', 'talent', 'operational'] },
                { label: 'Status', key: 'status', options: ['active', 'paused', 'complete'] },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence>
          {drills.map(drill => {
            const pct = Math.min(100, Math.round((drill.current / drill.target) * 100));
            return (
              <motion.div
                key={drill.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl p-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{drill.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(drill)} style={{ color: 'var(--text-muted)' }}><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(drill.id)} style={{ color: 'var(--text-muted)' }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{drill.type}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--success)22', color: 'var(--success)' }}>{drill.status}</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    <span>{drill.current.toLocaleString()} / {drill.target.toLocaleString()}</span>
                    <span style={{ color: pct >= 80 ? 'var(--success)' : 'var(--warning)' }}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: pct >= 80 ? 'var(--success)' : 'var(--warning)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {drills.length === 0 && (
          <div className="col-span-2 text-center py-8 text-xs rounded-xl" style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            No drills yet. Create one to start tracking growth.
          </div>
        )}
      </div>
    </div>
  );
}
