'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { betsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { clsx } from 'clsx';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En cours', color: 'text-bet-yellow' },
  WON: { label: 'Gagné', color: 'text-bet-green' },
  LOST: { label: 'Perdu', color: 'text-bet-red' },
  CANCELLED: { label: 'Annulé', color: 'text-slate-400' },
  VOID: { label: 'Nul', color: 'text-slate-400' },
};

export default function BetsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [bets, setBets] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    betsApi.list(filter !== 'all' ? filter : undefined).then((r) => {
      setBets(r.data);
      setLoading(false);
    });
  }, [user, filter]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <h1 className="text-xl font-bold mb-4">Mes Paris</h1>

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', 'PENDING', 'WON', 'LOST'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border',
              filter === s
                ? 'bg-haiti-blue border-haiti-blue text-white'
                : 'border-bet-border text-slate-400 hover:text-white',
            )}
          >
            {s === 'all' ? 'Tous' : STATUS_LABELS[s]?.label ?? s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Chargement...</div>
      ) : bets.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">🎲</div>
          <p>Aucun pari {filter !== 'all' ? STATUS_LABELS[filter]?.label.toLowerCase() : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bets.map((bet) => (
            <div key={bet.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className={clsx('text-sm font-bold', STATUS_LABELS[bet.status]?.color)}>
                    {STATUS_LABELS[bet.status]?.label ?? bet.status}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    {new Date(bet.placedAt).toLocaleDateString('fr-HT', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Mise: {parseFloat(bet.totalStake).toLocaleString()} HTG</div>
                  {bet.status === 'WON' && (
                    <div className="text-bet-green font-bold text-sm">
                      +{parseFloat(bet.potentialWin).toLocaleString()} HTG
                    </div>
                  )}
                </div>
              </div>

              {/* Selections */}
              <div className="space-y-2">
                {bet.selections.map((sel: any) => (
                  <div key={sel.id} className="flex items-center justify-between text-sm py-2 border-t border-bet-border/50">
                    <div>
                      <div className="text-slate-400 text-xs">{sel.market?.name}</div>
                      <div className="font-medium">{sel.outcome?.name}</div>
                    </div>
                    <span className="text-odds">{parseFloat(sel.oddsValue).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {bet.status === 'PENDING' && (
                <div className="mt-3 text-right text-xs text-slate-400">
                  Gain potentiel: <span className="text-haiti-gold font-bold">
                    {parseFloat(bet.potentialWin).toLocaleString()} HTG
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
