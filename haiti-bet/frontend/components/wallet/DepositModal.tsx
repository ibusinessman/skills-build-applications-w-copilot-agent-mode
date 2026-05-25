'use client';
import { useState } from 'react';
import { paymentsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const AMOUNT_PRESETS = [500, 1000, 2500, 5000, 10000, 25000];

export function DepositModal({ onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    if (amount < 100) {
      toast.error('Minimum 100 HTG');
      return;
    }
    setLoading(true);
    try {
      const result = await paymentsApi.deposit(amount);
      // Redirect to MonCash payment page
      if (result.data.redirectUrl) {
        window.location.href = result.data.redirectUrl;
      }
    } catch (err: any) {
      toast.error(err.error ?? 'Erreur de paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-bet-card border border-bet-border rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Déposer via MonCash</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="text-center mb-4">
          <div className="text-4xl mb-2">📱</div>
          <p className="text-sm text-slate-400">
            Vous allez être redirigé vers MonCash pour payer en toute sécurité.
          </p>
        </div>

        {/* Amount presets */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {AMOUNT_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                amount === preset
                  ? 'border-haiti-blue bg-blue-950 text-white'
                  : 'border-bet-border text-slate-300 hover:border-slate-400'
              }`}
            >
              {preset.toLocaleString()} HTG
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex items-center gap-2 mb-6">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="Montant"
            className="flex-1 bg-bet-dark border border-bet-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-haiti-blue"
          />
          <span className="text-sm text-slate-400 w-10">HTG</span>
        </div>

        <button
          onClick={handleDeposit}
          disabled={loading || amount < 100}
          className="w-full btn-primary py-3 text-base font-bold"
        >
          {loading ? 'Redirection...' : `Payer ${amount.toLocaleString()} HTG`}
        </button>

        <p className="text-xs text-slate-500 text-center mt-3">
          Paiement sécurisé par MonCash · Digicel
        </p>
      </div>
    </div>
  );
}
