'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paymentsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { DepositModal } from '@/components/wallet/DepositModal';
import toast from 'react-hot-toast';

const TX_ICONS: Record<string, string> = {
  DEPOSIT: '⬆️',
  WITHDRAWAL: '⬇️',
  BET_STAKE: '🎲',
  BET_WIN: '🏆',
  BET_REFUND: '↩️',
  BONUS: '🎁',
};

const TX_COLORS: Record<string, string> = {
  DEPOSIT: 'text-bet-green',
  BET_WIN: 'text-bet-green',
  BET_REFUND: 'text-bet-green',
  BONUS: 'text-bet-green',
  WITHDRAWAL: 'text-bet-red',
  BET_STAKE: 'text-bet-red',
};

export default function WalletPage() {
  const { user, updateBalance } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [showDeposit, setShowDeposit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadData();

    // Handle MonCash return
    if (searchParams.get('payment') === 'complete') {
      toast.success('Dépôt confirmé! Votre solde a été mis à jour.');
    }
  }, [user]);

  async function loadData() {
    try {
      const [balRes, txRes] = await Promise.all([
        paymentsApi.balance(),
        paymentsApi.transactions(),
      ]);
      setBalance(balRes.data.balance);
      setTransactions(txRes.data);
      updateBalance(balRes.data.balance);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Balance card */}
      <div className="card bg-gradient-to-r from-haiti-blue to-blue-900 border-blue-700 mb-6">
        <p className="text-blue-200 text-sm mb-1">Solde disponible</p>
        <div className="text-4xl font-black text-white mb-4">
          {loading ? '—' : balance.toLocaleString()} HTG
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowDeposit(true)} className="flex-1 btn-success py-2.5">
            ⬆️ Déposer
          </button>
          <button
            onClick={() => toast.info('Retraits via admin pour l\'instant')}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            ⬇️ Retirer
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <div className="card">
        <h2 className="font-bold text-base mb-4">Historique des transactions</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Aucune transaction pour le moment
          </div>
        ) : (
          <div className="space-y-1 divide-y divide-bet-border">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-3">
                <span className="text-xl">{TX_ICONS[tx.type] ?? '•'}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{formatTxType(tx.type)}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(tx.createdAt).toLocaleDateString('fr-HT', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                    {' '}·{' '}
                    <span className={`font-medium ${
                      tx.status === 'COMPLETED' ? 'text-bet-green' :
                      tx.status === 'FAILED' ? 'text-bet-red' : 'text-bet-yellow'
                    }`}>{tx.status}</span>
                  </div>
                </div>
                <div className={`font-bold text-sm ${TX_COLORS[tx.type] ?? 'text-white'}`}>
                  {['DEPOSIT', 'BET_WIN', 'BET_REFUND', 'BONUS'].includes(tx.type) ? '+' : '-'}
                  {parseFloat(tx.amount).toLocaleString()} HTG
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDeposit && (
        <DepositModal
          onClose={() => setShowDeposit(false)}
          onSuccess={() => { loadData(); setShowDeposit(false); }}
        />
      )}
    </div>
  );
}

function formatTxType(type: string) {
  const labels: Record<string, string> = {
    DEPOSIT: 'Dépôt MonCash',
    WITHDRAWAL: 'Retrait MonCash',
    BET_STAKE: 'Mise pari',
    BET_WIN: 'Gain pari',
    BET_REFUND: 'Remboursement',
    BONUS: 'Bonus',
  };
  return labels[type] ?? type;
}
