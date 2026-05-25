'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ phone: '', name: '', password: '' });
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleRegister = async () => {
    if (!form.phone || !form.name) return toast.error('Remplissez tous les champs');
    setLoading(true);
    try {
      await authApi.register(form);
      setStep(2);
      toast.success('Code OTP envoyé!');
    } catch (err: any) {
      toast.error(err.error ?? 'Erreur inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const result = await authApi.verifyOtp(form.phone, otpCode, 'registration');
      if (result.data?.token) {
        login(result.data.token, result.data.user);
        toast.success('Compte créé avec succès!');
        router.push('/');
      }
    } catch (err: any) {
      toast.error(err.error ?? 'Code invalide');
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
          <p className="text-slate-400 text-sm mt-1">Créez votre compte gratuit</p>
        </div>

        <div className="card space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Jean Pierre"
                  className="w-full bg-bet-dark border border-bet-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-haiti-blue"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="+50912345678"
                  className="w-full bg-bet-dark border border-bet-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-haiti-blue"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mot de passe (optionnel)</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Minimum 6 caractères"
                  className="w-full bg-bet-dark border border-bet-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-haiti-blue"
                />
              </div>
              <button onClick={handleRegister} disabled={loading} className="w-full btn-primary py-3">
                {loading ? 'Inscription...' : "S'inscrire"}
              </button>
            </>
          ) : (
            <>
              <div className="text-center py-2">
                <div className="text-3xl mb-2">📱</div>
                <p className="text-sm text-slate-300">
                  Code envoyé au <span className="font-bold text-white">{form.phone}</span>
                </p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Code de vérification (6 chiffres)</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-bet-dark border border-bet-border rounded-lg px-3 py-2.5 text-xl text-center tracking-widest focus:outline-none focus:border-haiti-blue"
                />
              </div>
              <button onClick={handleVerify} disabled={loading || otpCode.length !== 6} className="w-full btn-primary py-3">
                {loading ? 'Vérification...' : 'Confirmer'}
              </button>
            </>
          )}

          <p className="text-center text-sm text-slate-400">
            Déjà inscrit?{' '}
            <Link href="/auth/login" className="text-haiti-gold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
