import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, Users, X } from 'lucide-react';

interface Unit {
  id: string;
  name: string;
  lead: string;
  headcount: number;
  focus: string;
  performance: number;
}

export function RevenueUnitsView() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [form, setForm] = useState({ name: '', lead: '', headcount: '', focus: '', performance: '' });

  useEffect(() => {
    fetch('/api/units').then(r => r.json()).then(setUnits).catch(console.error);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', lead: '', headcount: '', focus: '', performance: '' });
    setShowForm(true);
  };

  const openEdit = (u: Unit) => {
    setEditing(u);
    setForm({ name: u.name, lead: u.lead, headcount: String(u.headcount), focus: u.focus, performance: String(u.performance) });
    setShowForm(true);
  };

  const save = async () => {
    const body = { ...form, headcount: Number(form.headcount), performance: Number(form.performance) };
    if (editing) {
      const res = await fetch(`/api/units/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const updated = await res.json();
      setUnits(prev => prev.map(u => u.id === updated.id ? updated : u));
    } else {
      const res = await fetch('/api/units', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const created = await res.json();
      setUnits(prev => [...prev, created]);
    }
    setShowForm(false);
  };

  const remove = async (id: string) => {
    await fetch(`/api/units/${id}`, { method: 'DELETE' });
    setUnits(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Revenue Units</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Team unit performance management</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus className="w-4 h-4" /> New Unit
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
                  {editing ? 'Edit Unit' : 'New Unit'}
                </h2>
                <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              {[
                { label: 'Unit Name', key: 'name', placeholder: 'Unit name', type: 'text' },
                { label: 'Lead', key: 'lead', placeholder: 'Team lead name', type: 'text' },
                { label: 'Headcount', key: 'headcount', placeholder: '0', type: 'number' },
                { label: 'Focus', key: 'focus', placeholder: 'Enterprise / SMB / etc.', type: 'text' },
                { label: 'Performance Score (0-100)', key: 'performance', placeholder: '0', type: 'number' },
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
          {units.map(unit => (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{unit.name}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(unit)} style={{ color: 'var(--text-muted)' }}><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(unit.id)} style={{ color: 'var(--text-muted)' }}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: 'Lead', value: unit.lead },
                  { label: 'Headcount', value: String(unit.headcount) },
                  { label: 'Focus', value: unit.focus },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  <span>Performance</span>
                  <span style={{ color: unit.performance >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                    {unit.performance}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: unit.performance >= 80 ? 'var(--success)' : 'var(--warning)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${unit.performance}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {units.length === 0 && (
          <div className="col-span-2 text-center py-8 text-xs rounded-xl" style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            No units yet. Create one to manage revenue teams.
          </div>
        )}
      </div>
    </div>
  );
}
