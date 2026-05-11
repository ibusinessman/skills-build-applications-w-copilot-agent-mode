import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../App.jsx';
import { features, getGreeting } from '../i18n.js';
import { api } from '../api.js';
import Logo from '../components/Logo.jsx';
import LanguageToggle from '../components/LanguageToggle.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';
import PageSEO from '../components/PageSEO.jsx';

export default function Home() {
  const { lang, t, setUnread } = useLang();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.dashboard();
      setData(d);
      setUnread(d.unread_notifications ?? 0);
    } catch (e) {
      setError(e.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [setUnread]);

  useEffect(() => { load(); }, [load]);

  const seoDesc = lang === 'ht'
    ? 'Tableau de bord Xtra Assurance — Balans ou, zon risk GPS, ak reklamasyon rapid pou mototaxi ann Ayiti. Peye ak MonCash.'
    : 'Tableau de bord Xtra Assurance — Votre solde, alertes zones à risque GPS, et réclamations rapides pour mototaxi en Haïti. Paiement MonCash.';

  return (
    <div>
      <PageSEO
        path="/"
        title={lang === 'ht' ? 'Akèy — Asirans Mototaxi Ayiti' : 'Accueil — Assurance Mototaxi Haïti'}
        description={seoDesc}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Xtra Assurance — Akèy',
          description: seoDesc,
          url: 'https://xtra-asirans.ht/',
          breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Akèy', item: 'https://xtra-asirans.ht/' }
          ]},
        }}
      />
      {/* Sticky top bar */}
      <div className="top-bar">
        <Logo variant="full" size={26} />
        <LanguageToggle />
      </div>

      <div className="screen">
        {/* Error state */}
        {!loading && error && (
          <div className="alert-card fade-in" role="alert" style={{ marginBottom: 12 }}>
            <div className="alert-title">⚠️ {t('error_network')}</div>
            <div className="alert-text">{error}</div>
            <button className="btn-outline" onClick={load} style={{ marginTop: 10, width: 'auto', padding: '8px 20px', fontSize: 13 }}>
              {t('retry')}
            </button>
          </div>
        )}

        {/* Personalized greeting + balance */}
        <div className="greeting-block fade-in">
          <p className="greeting-text">
            {getGreeting(t)}{data ? ',' : '!'}
          </p>
          {!loading && data ? (
            <>
              <div className="greeting-balance">
                <span className="balance-prefix">{t('balance_label')}</span>
                <span className="balance-value">{data.balance_gourdes.toLocaleString()} g</span>
              </div>
              {data.rc_active && (
                <span className="rc-badge-mini">🛡️ RC Aktif</span>
              )}
            </>
          ) : (
            <SkeletonCard />
          )}
        </div>

        {/* Hero CTA card */}
        <div className="hero-cta-card fade-in-up">
          <div className="hero-cta-bg" aria-hidden="true" />
          <div className="hero-cta-content">
            <Logo variant="hero" size={88} animated />
            <h1 className="hero-cta-headline">{t('hero_headline')}</h1>
            <p className="hero-cta-tag">{t('tagline')}</p>
            <button
              className="btn-gold btn-large btn-shimmer"
              onClick={() => navigate('/xtra-reklamasyon')}
            >
              {t('scan_btn')}
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="trust-badges fade-in-up">
          <span className="badge">{t('trust_badge1')}</span>
          <span className="badge">{t('trust_badge2')}</span>
          <span className="badge">{t('trust_badge3')}</span>
        </div>

        {/* Quick actions row */}
        <div className="section fade-in-up">
          <div className="quick-actions quick-actions-4">
            <div className="qa-card" role="button" tabIndex={0} onClick={() => navigate('/xtra-panne')}>
              <span className="qa-icon">📊</span>
              <span>{t('dashboard')}</span>
            </div>
            <div className="qa-card" role="button" tabIndex={0} onClick={() => navigate('/wallet')}>
              <span className="qa-icon">💼</span>
              <span>{t('wallet')}</span>
            </div>
            <div className="qa-card" role="button" tabIndex={0} onClick={() => navigate('/referrals')}>
              <span className="qa-icon">🎁</span>
              <span>{t('referrals')}</span>
            </div>
            <div className="qa-card" role="button" tabIndex={0} onClick={() => navigate('/notifications')}>
              <span className="qa-icon">🔔</span>
              <span>{t('notifications')}</span>
              {data?.unread_notifications > 0 && (
                <span className="qa-badge">{data.unread_notifications}</span>
              )}
            </div>
          </div>
        </div>

        {/* Risk alert (if applicable) */}
        {data?.risk_score > 0.7 && (
          <div className="alert-card fade-in-up" role="alert">
            <div className="alert-title">{t('risk_alert')}</div>
            <div className="alert-text">{t('alert_text')}</div>
          </div>
        )}

        {/* Features grid */}
        <div className="section fade-in-up">
          <h2 className="section-title gold-text">{t('features_title')}</h2>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="feature-icon">{f.icon}</span>
                <p className="feature-text">{f[lang]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral banner */}
        <div
          className="referral-banner fade-in-up"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/referrals')}
        >
          <div style={{ fontWeight: 800, marginBottom: 4 }}>{t('referral_hero')}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>{t('referral_sub')}</div>
        </div>

        {/* Certif footer */}
        <p className="certif-bar fade-in-up">{t('certif')}</p>
      </div>
    </div>
  );
}
