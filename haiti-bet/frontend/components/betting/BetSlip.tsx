'use client';
import { useState } from 'react';
import { useBetSlipStore } from '@/store/betSlip.store';
import { useAuthStore } from '@/store/auth.store';
import { betsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { createId } from '@paralleldrive/cuid2';

const STAKE_PRESETS = [50, 100, 250, 500, 1000, 2500];

export function BetSlip() {
  const { selections, stake, isOpen, setStake, clearSlip, toggleOpen, potentialWin, combinedOdds, removeSelection } =
    useBetSlipStore();
  const { user, updateBalance } = useAuthStore();
  const [isPlacing, setIsPlacing] = useState(false);

  if (!isOpen) return null;

  const handlePlace = async () => {
    if (!user) {
      toast.error('Connectez-vous pour parier');
      return;
    }
    if (selections.length === 0) return;
    if (stake < 25) {
      toast.error('Mise minimum: 25 HTG');
      return;
    }
    if (stake > parseFloat(user.balance?.toString() ?? '0')) {
      toast.error('Solde insuffisant');
      return;
    }

    setIsPlacing(true);
    try {
      await betsApi.place({
        stake,
        selections: selections.map((s) => ({ marketId: s.marketId, outcomeId: s.outcomeId })),
        idempotencyKey: createId(),
      });
      toast.success(`Pari placé! Gain potentiel: ${potentialWin().toLocaleString()} HTG`);
      updateBalance(parseFloat(user.balance?.toString() ?? '0') - stake);
      clearSlip();
    } catch (err: any) {
      toast.error(err.error ?? 'Erreur lors du placement');
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-0 w-full sm:w-96 z-50">
      <div className="bg-bet-card border border-bet-border border-b-0 sm:rounded-t-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bet-border">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">🎲 Coupon</span>
            <span className="px-2 py-0.5 text-xs bg-haiti-blue text-white rounded-full">
              {selections.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selections.length > 0 && (
              <button onClick={clearSlip} className="text-xs text-slate-400 hover:text-red-400 transition-colors">
                Effacer
              </button>
            )}
            <button onClick={toggleOpen} className="text-slate-400 hover:text-white">✕</button>
          </div>
        </div>

        {selections.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-400 text-sm">
            Cliquez sur des cotes pour ajouter des sélections
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {selections.map((sel) => (
              <div key={sel.outcomeId} className="flex items-center gap-2 px-4 py-3 border-b border-bet-border/50">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-400 truncate">{sel.marketName}</div>
                  <div className="text-sm font-medium truncate">{sel.outcomeName}</div>
                </div>
                <span className="text-odds shrink-0">{sel.odds.toFixed(2)}</span>
                <button
                  onClick={() => removeSelection(sel.outcomeId)}
                  className="text-slate-500 hover:text-red-400 shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {selections.length > 1 && (
          <div className="px-4 py-2 text-xs text-slate-400 border-t border-bet-border/50">
            Cote combinée: <span className="text-odds">{combinedOdds().toFixed(2)}</span>
          </div>
        )}

        {selections.length > 0 && (
          <div className="px-4 pb-4 space-y-3">
            {/* Stake presets */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {STAKE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setStake(preset)}
                  className={clsx(
                    'text-xs py-1.5 rounded-lg border transition-colors',
                    stake === preset
                      ? 'border-haiti-blue bg-blue-950 text-white'
                      : 'border-bet-border text-slate-400 hover:border-slate-500',
                  )}
                >
                  {preset.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Custom stake */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Mise (HTG)"
                className="flex-1 bg-bet-dark border border-bet-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-haiti-blue"
              />
              <span className="text-xs text-slate-400">HTG</span>
            </div>

            {/* Potential win */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Gain potentiel</span>
              <span className="text-haiti-gold font-bold text-lg">
                {potentialWin().toLocaleString()} HTG
              </span>
            </div>

            {/* Place bet */}
            <button
              onClick={handlePlace}
              disabled={isPlacing || stake < 25}
              className="w-full btn-success py-3 text-base font-bold"
            >
              {isPlacing ? 'Traitement...' : 'Placer le pari'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
