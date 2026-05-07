import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, Zap, X } from 'lucide-react';

interface Operation {
  id: string;
  name: string;
  status: string;
  market: string;
  revenue: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--success)',
  planning: 'var(--warning)',
  paused: 'var(--text-muted)',
  complete: 'var(--accent)',
};

export function OperationsView() {
  const [ops, setOps] = useState<Operation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Operation | null>(null);
  const [form, setForm] = useState({ name: '', status: 'planning', market: '', revenue: '' });

  useEffect(() => {
    fetch('/api/operations')
      .then(r => r.json())
      .then(setOps)
      .catch(console.error);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', status: 'planning', market: '', revenue: '' });
    setShowForm(true);
  };

  const openEdit = (op: Operation) => {
    setEditing(op);
    setForm({ name: op.name, status: op.status, market: op.market, revenue: String(op.revenue) });
    setShowForm(true);
  };

  const save = async () => {
    const body = { ...form, revenue: Number(form.revenue) };
    if (editing) {
      const res = await fetch(`/api/operations/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const updated = await res.json();
      setOps(prev => prev.map(o => o.id === updated.id ? updated : o));
    } else {
      const res = await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const created = await res.json();
      setOps(prev => [...prev, created]);
    }
    setShowForm(false);
  };

  const remove = async (id: string) => {
    await fetch(`/api/operations/${id}`, { method: 'DELETE' });
    setOps(prev => prev.filter(o => o.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Operations</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Market operations management
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus className="w-4 h-4" /> New Operation
        </button>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="rounded-xl p-6 w-full max-w-md space-y-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {editing ? 'Edit Operation' : 'New Operation'}
                </h2>
                <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              {[
                { label: 'Name', key: 'name', placeholder: 'Operation name' },
                { label: 'Market', key: 'market', placeholder: 'Target market' },
                { label: 'Revenue Target', key: 'revenue', placeholder: '0' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    type={f.key === 'revenue' ? 'number' : 'text'}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {['planning', 'active', 'paused', 'complete'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={save}
                  className="flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              {['Name', 'Market', 'Status', 'Revenue', 'Created', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {ops.map(op => (
                <motion.tr
                  key={op.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  className="hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                      {op.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{op.market}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: (STATUS_COLORS[op.status] || 'var(--text-muted)') + '22',
                        color: STATUS_COLORS[op.status] || 'var(--text-muted)',
                      }}
                    >
                      {op.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    ${op.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(op.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(op)} style={{ color: 'var(--text-muted)' }} className="hover:text-white transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(op.id)} style={{ color: 'var(--text-muted)' }} className="hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {ops.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No operations yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
