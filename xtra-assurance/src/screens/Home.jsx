import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../App.jsx';
import { features } from '../i18n.js';
import LanguageToggle from '../components/LanguageToggle.jsx';

export default function Home() {
  const { lang, t } = useLang();
  const navigate = useNavigate();

  return (
    <div>
      {/* Sticky top bar */}
      <div className="top-bar">
        <div className="brand-badge">
          <span className="brand-star">⭐</span>
          <span className="brand-name">XTRA ASSURANCE</span>
        </div>
        <LanguageToggle />
      </div>

      <div className="screen">
        {/* Hero */}
        <div className="hero">
          <div className="hero-glow" aria-hidden="true" />
          <span className="hero-icon" role="img" aria-label="shield">🛡️</span>
          <h1 className="hero-headline">{t('hero_headline')}</h1>
          <p className="hero-tagline">{t('tagline')}</p>
          <span className="origin-badge">{t('origin')}</span>
        </div>

        {/* Primary CTA */}
        <div className="cta-section">
          <button
            className="btn-gold btn-large"
            onClick={() => navigate('/xtra-reklamasyon')}
          >
            {t('scan_btn')}
          </button>
        </div>

        {/* Trust badges */}
        <div className="trust-badges">
          <span className="badge">{t('trust_badge1')}</span>
          <span className="badge">{t('trust_badge2')}</span>
          <span className="badge">{t('trust_badge3')}</span>
        </div>

        {/* Features grid */}
        <div className="section">
          <h2 className="section-title gold-text">{t('features_title')}</h2>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <span className="feature-icon" role="img" aria-hidden="true">{f.icon}</span>
                <p className="feature-text">{f[lang]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral banner */}
        <div
          className="referral-banner"
          role="button"
          tabIndex={0}
          onClick={() => {}}
        >
          {t('referral_full')}
        </div>

        {/* Dashboard shortcut */}
        <div className="cta-section" style={{ padding: '0 0 12px' }}>
          <button
            className="btn-outline"
            onClick={() => navigate('/xtra-panne')}
          >
            📊 {t('dashboard_title')}
          </button>
        </div>

        {/* Certif footer */}
        <p className="certif-bar">{t('certif')}</p>
      </div>
    </div>
  );
}
