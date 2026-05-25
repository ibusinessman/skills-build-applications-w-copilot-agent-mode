'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [mode, setMode] = useState<'password' | 'otp'>('otp');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone) return toast.error('Entrez votre numéro de téléphone');
    setLoading(true);
    try {
      await authApi.sendOtp(phone, 'login');
      setOtpSent(true);
      toast.success('Code OTP envoyé!');
    } catch (err: any) {
      toast.error(err.error ?? 'Erreur envoi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    setLoading(true);
    try {
      const result = await authApi.verifyOtp(phone, otpCode, 'login');
      if (result.data?.token) {
        login(result.data.token, result.data.user);
        toast.success('Connexion réussie!');
        router.push('/');
      }
    } catch (err: any) {
      toast.error(err.error ?? 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    setLoading(true);
    try {
      const result = await authApi.login({ phone, password });
      login(result.data.token, result.data.user);
      toast.success('Connexion réussie!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.error ?? 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🇭🇹</div>
          <h1 className="text-2xl font-black">
            <span className="text-haiti-blue">Haiti</span>
            <span className="text-haiti-red">Bet</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Connectez-vous à votre compte</p>
        </div>

        <div className="card space-y-4">
          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-bet-border">
            {(['otp', 'password'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === m ? 'bg-haiti-blue text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'otp' ? '📱 Code OTP' : '🔑 Mot de passe'}
              </button>
            ))}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Numéro de téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+50912345678"
              className="w-full bg-bet-dark border border-bet-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-haiti-blue"
            />
          </div>

          {mode === 'password' ? (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bet-dark border border-bet-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-haiti-blue"
                />
              </div>
              <button onClick={handlePasswordLogin} disabled={loading} className="w-full btn-primary py-3">
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </>
          ) : otpSent ? (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Code reçu par SMS</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-bet-dark border border-bet-border rounded-lg px-3 py-2.5 text-sm text-center text-xl tracking-widest focus:outline-none focus:border-haiti-blue"
                />
              </div>
              <button onClick={handleOtpLogin} disabled={loading || otpCode.length !== 6} className="w-full btn-primary py-3">
                {loading ? 'Vérification...' : 'Confirmer'}
              </button>
              <button onClick={() => setOtpSent(false)} className="w-full text-sm text-slate-400 hover:text-white">
                Renvoyer le code
              </button>
            </>
          ) : (
            <button onClick={handleSendOtp} disabled={loading} className="w-full btn-primary py-3">
              {loading ? 'Envoi...' : 'Envoyer le code OTP'}
            </button>
          )}

          <p className="text-center text-sm text-slate-400">
            Pas encore inscrit?{' '}
            <Link href="/auth/register" className="text-haiti-gold hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
