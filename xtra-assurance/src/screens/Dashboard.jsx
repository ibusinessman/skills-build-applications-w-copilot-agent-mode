import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../App.jsx';
import { api } from '../api.js';
import PageSEO from '../components/PageSEO.jsx';

function Spinner() {
  return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gold)', fontSize: 32 }}>⚙️</div>;
}

function ErrorCard({ msg, onRetry }) {
  return (
    <div className="alert-card" style={{ textAlign: 'center' }}>
      <div className="alert-title">⚠️ Erreur réseau</div>
      <div className="alert-text">{msg}</div>
      {onRetry && (
        <button className="btn-gold mt-12" onClick={onRetry} style={{ marginTop: 12 }}>
          Réessayer
        </button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.dashboard();
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="screen"><Spinner /></div>;
  if (error)   return <div className="screen"><div className="screen-header"><h1 className="screen-title">{t('dashboard_title')}</h1></div><ErrorCard msg={error} onRetry={load} /></div>;

  const { balance_gourdes, rc_active, risk_score, stats, active_policy, high_risk_zones, recent_claims, unread_notifications } = data;
  const balancePct = Math.min(Math.round((balance_gourdes / 2_000_000) * 100), 100);

  const dashDesc = lang === 'ht'
    ? `Tableau de bord Xtra Assurance — Balans ${balance_gourdes?.toLocaleString() ?? ''}g, RC ${rc_active ? 'Aktif' : 'Inaktif'}, zon risk GPS ann Ayiti.`
    : `Tableau de bord Xtra Assurance — Solde ${balance_gourdes?.toLocaleString() ?? ''}g, RC ${rc_active ? 'Actif' : 'Inactif'}, alertes zones à risque en Haïti.`;

  return (
    <div className="screen">
      <PageSEO
        path="/xtra-panne"
        title={lang === 'ht' ? 'Tablo Bò — Xtra Panne' : 'Tableau de Bord — Xtra Panne'}
        description={dashDesc}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Xtra Assurance Dashboard',
          description: dashDesc,
          breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Akèy', item: 'https://xtra-asirans.ht/' },
            { '@type': 'ListItem', position: 2, name: 'Tablo Bò', item: 'https://xtra-asirans.ht/xtra-panne' },
          ]},
        }}
      />
      <div className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="screen-title">{t('dashboard_title')}</h1>
        {unread_notifications > 0 && (
          <span style={{
            background: 'var(--warning)', color: '#001233',
            borderRadius: '50%', width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800,
          }}>{unread_notifications}</span>
        )}
      </div>

      {/* Balance card */}
      <div className="card gold-card">
        <div className="card-label">{t('solde_title')}</div>
        <div className="balance-amount">{balance_gourdes.toLocaleString()} g</div>
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${balancePct}%` }} />
        </div>
        <div className="card-sub">{t('balance_progress')}</div>
      </div>

      {/* RC Premium card */}
      <div className="card">
        <div className="rc-header">
          <div className="card-label">{t('rc_pro')}</div>
          <span className={`rc-status ${rc_active ? 'active' : 'inactive'}`}>
            {rc_active ? t('rc_active') : t('rc_inactive')}
          </span>
        </div>
        {active_policy ? (
          <div className="card-sub" style={{ marginBottom: 12 }}>
            Valide jusqu'au {active_policy.end_date} · {active_policy.days_remaining}j restants
          </div>
        ) : null}
        <button className="btn-gold" onClick={() => navigate('/xtra-reklamasyon')}>
          {rc_active ? t('claim_title') : t('rc_cta')}
        </button>
      </div>

      {/* Risk alert */}
      {risk_score > 0.7 && (
        <div className="alert-card" role="alert">
          <div className="alert-title">{t('risk_alert')}</div>
          <div className="alert-text">{t('alert_text')}</div>
          {high_risk_zones?.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {high_risk_zones.map(z => (
                <div key={z.id} style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>⚠️ {z.name}</span>
                  <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{Math.round(z.risk_score * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Sinistres', value: stats.total_claims },
          { label: 'Payés',     value: stats.paid_claims },
          { label: 'Filleuls',  value: stats.total_referrals },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold)' }}>{s.value}</div>
            <div className="card-label" style={{ marginBottom: 0 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent claims */}
      {recent_claims?.length > 0 && (
        <div className="section">
          <h2 className="section-title gold-text">{t('claim_title')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent_claims.map(c => (
              <div key={c.id} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.amount_gourdes.toLocaleString()} g</div>
                  <div className="card-label" style={{ marginBottom: 0, fontSize: 11 }}>{c.description || '—'}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                  background: c.status === 'paid' ? 'rgba(0,208,132,0.14)' : 'rgba(255,149,0,0.14)',
                  color: c.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                  border: `1px solid ${c.status === 'paid' ? 'rgba(0,208,132,0.35)' : 'rgba(255,149,0,0.35)'}`,
                }}>
                  {c.status_display}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-8">
        <p className="qa-title">{t('quick_actions')}</p>
        <div className="quick-actions">
          <div className="qa-card" role="button" tabIndex={0} onClick={() => navigate('/xtra-reklamasyon')}>
            <span className="qa-icon">📋</span>
            <span>{t('claim_title')}</span>
          </div>
          <div className="qa-card" role="button" tabIndex={0}>
            <span className="qa-icon">💬</span>
            <span>{t('wa_support')}</span>
          </div>
          <div className="qa-card" role="button" tabIndex={0}>
            <span className="qa-icon">🎁</span>
            <span>{t('referral')}</span>
          </div>
        </div>
      </div>

      {/* Premium upsell */}
      <div className="premium-card">
        <div className="premium-title">⭐ {t('premium_title')}</div>
        <ul className="premium-features">
          <li>{t('f1')}</li>
          <li>{t('f2')}</li>
          <li>{t('f3')}</li>
        </ul>
        <button className="btn-gold">{t('upgrade_btn')}</button>
      </div>
    </div>
  );
}
