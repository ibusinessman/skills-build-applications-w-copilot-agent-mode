import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2, LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { SatorSquare } from '@/components/SatorSquare';

type Mode = 'login' | 'register';

interface AuthViewProps {
  onBack?: () => void;
}

export function AuthView({ onBack }: AuthViewProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', orgName: '',
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.orgName);
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  } as const;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </button>
      )}
      <div className="w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <SatorSquare highlight={[0, 6, 12, 18, 24]} />
          </div>
          <h1 className="text-3xl font-bold tracking-widest" style={{ color: 'var(--accent)' }}>
            SATOR
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Systematic Architecture via Tenet-Oriented Recursion
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8 space-y-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          {/* Tabs */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 text-sm font-medium transition-colors capitalize"
                style={{
                  background: mode === m ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: mode === m ? '#fff' : 'var(--text-muted)',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                    <input
                      value={form.name} onChange={update('name')}
                      placeholder="Your name" required
                      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Organization Name</label>
                    <input
                      value={form.orgName} onChange={update('orgName')}
                      placeholder="Acme Corp" required
                      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input
                type="email" value={form.email} onChange={update('email')}
                placeholder="you@company.com" required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={update('password')}
                  placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'} required
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none pr-10"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs py-2 px-3 rounded-lg" style={{ background: 'var(--danger)22', color: 'var(--danger)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />
              }
              {loading ? 'Working…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Demo hint */}
          {mode === 'login' && (
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Demo: <span
                className="cursor-pointer hover:underline"
                style={{ color: 'var(--accent)' }}
                onClick={() => setForm(p => ({ ...p, email: 'demo@sator.ai', password: 'demo1234' }))}
              >
                demo@sator.ai / demo1234
              </span>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
