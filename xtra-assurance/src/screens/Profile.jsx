import React, { useState, useEffect, useCallback } from 'react';
import { useLang } from '../App.jsx';
import { api } from '../api.js';
import { useToast } from '../toast.jsx';
import ScreenHeader from '../components/ScreenHeader.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';
import LanguageToggle from '../components/LanguageToggle.jsx';
import PageSEO from '../components/PageSEO.jsx';

export default function Profile({ onLogout }) {
  const { t } = useLang();
  const toast = useToast();
  const [me, setMe]         = useState(null);
  const [dash, setDash]     = useState(null);
  const [loading, setLoad]  = useState(true);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    setLoad(true);
    try {
      const [profile, dashboard] = await Promise.all([api.me(), api.dashboard()]);
      setMe(profile); setDash(dashboard);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoad(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  function handleLogout() {
    api.logout();
    onLogout?.();
  }

  if (loading || !me) {
    return (
      <div className="screen fade-in">
        <ScreenHeader title={t('profile_title')} />
        <SkeletonCard />
      </div>
    );
  }

  const initials = me.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const memberSince = new Date(me.created_at).toLocaleDateString();

  return (
    <div className="screen fade-in">
      <PageSEO
        path="/profile"
        title={lang === 'ht' ? 'Pwofil — Xtra Assurance' : 'Profil — Xtra Assurance'}
        description={lang === 'ht'
          ? 'Pwofil chauffè Xtra Assurance — vignèt, kòd parenaj, istwa reklamasyon, ak paramèt kont ou ann Ayiti.'
          : 'Profil chauffeur Xtra Assurance — vignette, code de parrainage, historique réclamations et paramètres du compte en Haïti.'}
      />
      <ScreenHeader title={t('profile_title')} />

      {/* Identity card */}
      <div className="card profile-card">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-name">{me.full_name}</div>
        <div className="profile-phone">+{me.phone}</div>
        <div className="profile-since">{t('member_since')} {memberSince}</div>

        <div className="profile-quick-row">
          <div className="quick-stat">
            <span className="quick-stat-icon">🏍️</span>
            <span className="quick-stat-value">{me.moto_count}</span>
            <span className="quick-stat-label">{t('moto_count')}</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-icon">🎫</span>
            <span className="quick-stat-value">{me.vignette_number || '—'}</span>
            <span className="quick-stat-label">{t('vignette')}</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-icon">🎁</span>
            <span className="quick-stat-value">{me.referral_code}</span>
            <span className="quick-stat-label">{t('referral_code')}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {dash && (
        <div className="section">
          <h2 className="section-title gold-text">{t('quick_stats')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="card stat-card">
              <div className="stat-value">{dash.stats.total_claims}</div>
              <div className="stat-label">{t('total_claims')}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{dash.stats.paid_claims}</div>
              <div className="stat-label">{t('paid_claims')}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{dash.stats.total_referrals}</div>
              <div className="stat-label">{t('total_referrals')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="section">
        <h2 className="section-title gold-text">{t('settings')}</h2>

        <div className="card setting-row">
          <div className="setting-icon">🌐</div>
          <div className="setting-body">
            <div className="setting-title">{t('language')}</div>
          </div>
          <LanguageToggle />
        </div>

        <div className="card setting-row" onClick={() => setConfirming(true)} style={{ cursor: 'pointer' }} role="button" tabIndex={0}>
          <div className="setting-icon" style={{ background: 'rgba(255,69,69,0.1)' }}>🚪</div>
          <div className="setting-body">
            <div className="setting-title" style={{ color: '#ff8080' }}>{t('logout')}</div>
          </div>
          <div className="setting-chevron">›</div>
        </div>
      </div>

      {/* Footer */}
      <p className="certif-bar" style={{ paddingTop: 12 }}>
        {t('certif')}
        <br />
        <span style={{ opacity: 0.6 }}>v1.0 · DubaiEd1.0-20260510</span>
      </p>

      {/* Logout modal */}
      {confirming && (
        <div className="modal-backdrop" onClick={() => setConfirming(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>🚪</div>
            <h3 style={{ textAlign: 'center', marginBottom: 20 }}>{t('confirm_logout')}</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-outline" onClick={() => setConfirming(false)}>{t('no')}</button>
              <button className="btn-gold" onClick={handleLogout}>{t('yes')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
