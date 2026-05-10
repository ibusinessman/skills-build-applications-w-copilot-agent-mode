import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../App.jsx';

const MOCK = {
  balance: 2000000,
  balancePct: 78,
  rcActive: true,
  riskScore: 0.82,
  motoCount: 3,
};

export default function Dashboard() {
  const { t } = useLang();
  const navigate = useNavigate();

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">{t('dashboard_title')}</h1>
      </div>

      {/* Balance card */}
      <div className="card gold-card">
        <div className="card-label">{t('solde_title')}</div>
        <div className="balance-amount">{MOCK.balance.toLocaleString()} g</div>
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${MOCK.balancePct}%` }} />
        </div>
        <div className="card-sub">{t('balance_progress')}</div>
      </div>

      {/* RC Premium card */}
      <div className="card">
        <div className="rc-header">
          <div className="card-label">{t('rc_pro')}</div>
          <span className={`rc-status ${MOCK.rcActive ? 'active' : 'inactive'}`}>
            {MOCK.rcActive ? t('rc_active') : t('rc_inactive')}
          </span>
        </div>
        <button className="btn-gold" onClick={() => {}}>
          {t('rc_cta')}
        </button>
      </div>

      {/* Risk alert */}
      {MOCK.riskScore > 0.7 && (
        <div className="alert-card" role="alert">
          <div className="alert-title">{t('risk_alert')}</div>
          <div className="alert-text">{t('alert_text')}</div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-8">
        <p className="qa-title">{t('quick_actions')}</p>
        <div className="quick-actions">
          <div
            className="qa-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/xtra-reklamasyon')}
          >
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
