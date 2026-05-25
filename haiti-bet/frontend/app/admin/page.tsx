'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (!user.isAdmin) { router.push('/'); return; }
    loadDashboard();
  }, [user]);

  async function loadDashboard() {
    try {
      const [statsRes, withdrawalsRes] = await Promise.all([
        api.get('/admin/stats').then((r) => r.data),
        api.get('/admin/withdrawals/pending').then((r) => r.data),
      ]);
      setStats(statsRes.data);
      setPendingWithdrawals(withdrawalsRes.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdrawal(id: string, action: 'approve' | 'reject') {
    try {
      await api.patch(`/admin/withdrawals/${id}`, { action });
      toast.success(`Retrait ${action === 'approve' ? 'approuvé' : 'refusé'}`);
      loadDashboard();
    } catch (err: any) {
      toast.error(err.error ?? 'Erreur');
    }
  }

  if (!user?.isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">⚙️</span>
        <h1 className="text-2xl font-bold">Tableau de bord Admin</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-bet-border pb-2">
        {['stats', 'withdrawals', 'audit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab ? 'text-haiti-gold border-b-2 border-haiti-gold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'stats' ? '📊 Stats' : tab === 'withdrawals' ? '💰 Retraits' : '📋 Audit'}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Utilisateurs actifs', value: stats.activeUsers, icon: '👥' },
            { label: 'Paris en cours', value: stats.bets?.PENDING ?? 0, icon: '🎲' },
            { label: 'Paris gagnés', value: stats.bets?.WON ?? 0, icon: '🏆' },
            { label: 'Total déposé', value: `${parseFloat(stats.totalDeposited ?? 0).toLocaleString()} HTG`, icon: '💰' },
          ].map((item) => (
            <div key={item.label} className="card text-center">
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-2xl font-black text-white">{item.value}</div>
              <div className="text-xs text-slate-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="card">
          <h2 className="font-bold mb-4">Retraits en attente ({pendingWithdrawals.length})</h2>
          {pendingWithdrawals.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">Aucun retrait en attente</p>
          ) : (
            <div className="space-y-3">
              {pendingWithdrawals.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-t border-bet-border">
                  <div>
                    <div className="font-medium">{tx.user?.name} · {tx.user?.phone}</div>
                    <div className="text-sm text-slate-400">
                      {parseFloat(tx.amount).toLocaleString()} HTG · {(tx.metadata as any)?.phone}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(tx.createdAt).toLocaleString('fr-HT')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleWithdrawal(tx.id, 'approve')}
                      className="btn-success text-xs py-1.5 px-3"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => handleWithdrawal(tx.id, 'reject')}
                      className="btn-danger text-xs py-1.5 px-3"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
