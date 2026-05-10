import React, { useState, useEffect, useCallback } from 'react';
import { useLang } from '../App.jsx';
import { api } from '../api.js';
import ScreenHeader from '../components/ScreenHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SkeletonCard, SkeletonRow } from '../components/Skeleton.jsx';
import PageSEO from '../components/PageSEO.jsx';

const TX_ICONS = {
  credit:         '💰',
  debit:          '💸',
  policy_payment: '🛡️',
  claim_payout:   '⚡',
  referral_bonus: '🎁',
};

export default function Wallet() {
  const { t } = useLang();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');  // all | credits | debits

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.wallet());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="screen fade-in">
        <ScreenHeader title={t('wallet_title')} />
        <SkeletonCard />
        <div style={{ height: 12 }} />
        <SkeletonRow /><div style={{ height: 8 }} /><SkeletonRow />
      </div>
    );
  }

  const txs = (data?.transactions || []).filter(tx => {
    if (filter === 'credits') return tx.amount_gourdes > 0;
    if (filter === 'debits')  return tx.amount_gourdes < 0;
    return true;
  });

  const totalIn  = (data?.transactions || []).filter(x => x.amount_gourdes > 0).reduce((s, x) => s + x.amount_gourdes, 0);
  const totalOut = (data?.transactions || []).filter(x => x.amount_gourdes < 0).reduce((s, x) => s + x.amount_gourdes, 0);

  const walletDesc = lang === 'ht'
    ? 'Pòtfèy Xtra Assurance — Wè balans ou, istwa tranzaksyon, peman asirans, ak bonus parenaj ann Haïti. MonCash entegre.'
    : 'Portefeuille Xtra Assurance — Consultez votre solde, historique des transactions, paiements d\'assurance et bonus de parrainage en Haïti. MonCash intégré.';

  return (
    <div className="screen fade-in">
      <PageSEO
        path="/wallet"
        title={lang === 'ht' ? 'Pòtfèy — Xtra Assurance' : 'Portefeuille — Xtra Assurance'}
        description={walletDesc}
      />
      <ScreenHeader title={t('wallet_title')} />

      {/* Hero balance card */}
      <div className="card gold-card balance-hero">
        <div className="card-label">{t('balance_label')}</div>
        <div className="balance-amount">{data.balance_gourdes.toLocaleString()} g</div>
        <div className="balance-flow">
          <div className="flow-item">
            <span style={{ color: 'var(--success)' }}>↗ +{totalIn.toLocaleString()}</span>
            <span className="flow-label">{t('credits')}</span>
          </div>
          <div className="flow-divider" />
          <div className="flow-item">
            <span style={{ color: '#ff8080' }}>↘ {totalOut.toLocaleString()}</span>
            <span className="flow-label">{t('debits')}</span>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {[
          { key: 'all',     label: t('all_transactions') },
          { key: 'credits', label: t('credits') },
          { key: 'debits',  label: t('debits') },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      {txs.length === 0 ? (
        <EmptyState icon="💼" title={t('no_transactions')} />
      ) : (
        <div className="tx-list">
          {txs.map(tx => {
            const isCredit = tx.amount_gourdes > 0;
            return (
              <div key={tx.id} className="tx-row">
                <div className={`tx-icon ${isCredit ? 'credit' : 'debit'}`}>
                  {TX_ICONS[tx.tx_type] || '💱'}
                </div>
                <div className="tx-body">
                  <div className="tx-desc">{tx.description}</div>
                  <div className="tx-meta">
                    <span>{tx.tx_type_display}</span>
                    {tx.reference && <span> · {tx.reference}</span>}
                  </div>
                </div>
                <div className={`tx-amount ${isCredit ? 'credit' : 'debit'}`}>
                  {isCredit ? '+' : ''}{tx.amount_gourdes.toLocaleString()} g
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
