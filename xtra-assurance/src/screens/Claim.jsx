import React, { useState, useCallback } from 'react';
import { useLang } from '../App.jsx';
import { api } from '../api.js';
import PageSEO from '../components/PageSEO.jsx';

function StepIndicator({ current, labels }) {
  return (
    <div className="step-indicator" role="list">
      {labels.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div className="step-item" role="listitem">
              <div className={`step-dot ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`step-label ${active ? 'active' : ''} ${done ? 'done' : ''}`}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={`step-connector ${done ? 'done' : ''}`} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function Claim() {
  const { t, lang } = useLang();
  const [step, setStep]           = useState(0);
  const [scanState, setScanState] = useState('idle'); // idle | scanning | done
  const [amount, setAmount]       = useState('3500');
  const [description, setDesc]    = useState('');
  const [moncash, setMoncash]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState(null);
  const [apiError, setApiError]   = useState(null);

  const parsedAmount = parseInt(amount, 10) || 0;

  const stepLabels = [t('claim_step1'), t('claim_step2'), t('claim_step3')];

  const handlePhotoTap = useCallback(() => {
    if (scanState !== 'idle') return;
    setScanState('scanning');
    setTimeout(() => setScanState('done'), 1800);
  }, [scanState]);

  async function handleSubmit() {
    setSubmitting(true);
    setApiError(null);
    try {
      const claim = await api.submitClaim({
        amount_gourdes: parsedAmount,
        description,
        moncash_phone: moncash,
      });
      setResult(claim);
      setStep(2);
    } catch (e) {
      setApiError(e.message || 'Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  }

  const canNext0 = scanState === 'done';
  const canNext1 = parsedAmount > 0 && moncash.length >= 8;

  const claimDesc = lang === 'ht'
    ? 'Soumèt yon reklamasyon asirans mototaxi ann Ayiti ak Xtra Assurance. Voye prèv ou (foto, videyo, dokiman) epi resevwa peman MonCash aprè revizyon rapid.'
    : 'Soumettre une réclamation assurance mototaxi en Haïti avec Xtra Assurance. Envoyez vos preuves (photos, vidéos, documents) et recevez votre paiement MonCash après révision rapide.';

  return (
    <div className="screen">
      <PageSEO
        path="/xtra-reklamasyon"
        title={lang === 'ht' ? 'Reklamasyon — Xtra Assurance' : 'Réclamation — Xtra Assurance'}
        description={claimDesc}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: lang === 'ht' ? 'Kijan pou soumèt yon reklamasyon moto ann Ayiti' : 'Comment soumettre une réclamation moto en Haïti',
          description: claimDesc,
          step: [
            { '@type': 'HowToStep', position: 1, name: 'Skane vignèt ou', text: 'Pran foto vignèt moto ou pou verifikasyon.' },
            { '@type': 'HowToStep', position: 2, name: 'Antre montan ak MonCash', text: 'Esplifye montan domaj la epi antre nimewo MonCash ou.' },
            { '@type': 'HowToStep', position: 3, name: 'Resevwa peman', text: 'Ekip Xtra revize prèv ou epi voye peman MonCash dirèkteman nan nimewo ou a.' },
          ],
        }}
      />
      <div className="screen-header">
        <h1 className="screen-title">{t('claim_screen_title')}</h1>
      </div>

      <StepIndicator current={step} labels={stepLabels} />

      {/* ── Step 0: OCR scan ────────────────────────────── */}
      {step === 0 && (
        <div className="step-card">
          <h2 className="step-title">{t('claim_step1')}</h2>
          <p className="step-tech">{t('claim_step1_tech')}</p>

          <div
            className="photo-zone"
            role="button"
            tabIndex={0}
            onClick={handlePhotoTap}
            onKeyDown={e => e.key === 'Enter' && handlePhotoTap()}
          >
            {scanState === 'idle' && (
              <div className="photo-placeholder">
                <span className="big-icon">📸</span>
                <span>{t('scan_placeholder')}</span>
              </div>
            )}
            {scanState === 'scanning' && (
              <div className="photo-scanning">
                <span className="scan-anim">⚙️</span>
                <p className="dim-text" style={{ fontSize: 13 }}>{t('loading_scan')}</p>
                <div className="scan-bar"><div className="scan-progress" /></div>
              </div>
            )}
            {scanState === 'done' && (
              <div className="photo-done">
                <span className="big-icon">📄</span>
                <p className="ok-text">{t('scan_success')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 1: Amount + MonCash ─────────────────────── */}
      {step === 1 && (
        <div className="step-card">
          <h2 className="step-title">{t('claim_step2')}</h2>
          <p className="step-tech">{t('claim_step1_tech')}</p>

          <div className="amount-zone">
            <div className="amount-big gold-text" style={{ fontSize: 28, marginBottom: 8 }}>
              {parsedAmount > 0 ? `${parsedAmount.toLocaleString()} g` : t('amount_detected')}
            </div>
            <div className="approval-pill review">{t('approve_review')}</div>
          </div>

          {/* Editable amount */}
          <div className="moncash-input-group mt-12">
            <label className="moncash-label" htmlFor="amount-input">{t('amount_label')}</label>
            <input
              id="amount-input"
              type="number"
              className="moncash-input"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1"
              inputMode="numeric"
            />
          </div>

          <div className="moncash-input-group mt-12">
            <label className="moncash-label" htmlFor="desc-input">{t('description_label')}</label>
            <input
              id="desc-input"
              type="text"
              className="moncash-input"
              placeholder={t('description_placeholder')}
              value={description}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          <div className="moncash-input-group mt-12">
            <label className="moncash-label" htmlFor="moncash-num">{t('moncash_label')}</label>
            <input
              id="moncash-num"
              type="tel"
              className="moncash-input"
              placeholder="509-XXXX-XXXX"
              value={moncash}
              onChange={e => setMoncash(e.target.value.replace(/\D/g, ''))}
              maxLength={11}
              inputMode="numeric"
            />
          </div>

          {apiError && (
            <div className="alert-card" style={{ marginTop: 12 }}>
              <div className="alert-text">⚠️ {apiError}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Confirmation ─────────────────────────── */}
      {step === 2 && result && (
        <div className="step-card">
          <h2 className="step-title">{t('claim_step3')}</h2>
          <p className="step-tech">{t('payout_time')}</p>

          <div className="payout-zone">
            <span className="payout-emoji" role="img" aria-label="review">🔍</span>
            <p className="payout-confirmed">{t('claim_review_msg')}</p>
            <p className="payout-time">{t('claim_review_eta')}</p>

            <div className="payout-breakdown">
              <div className="payout-row">
                <span>{t('claim_amount')}</span>
                <span>{result.amount_gourdes?.toLocaleString()} g</span>
              </div>
              <div className="payout-row">
                <span>{t('claim_moncash')}</span>
                <span>{result.moncash_phone || '—'}</span>
              </div>
              <div className="payout-row">
                <span>{t('claim_status')}</span>
                <span className="gold-text">{result.status_display}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="step-nav">
        {step > 0 && step < 2 && (
          <button className="btn-outline" onClick={() => setStep(s => s - 1)}>
            ← {t('back')}
          </button>
        )}

        {step === 0 && (
          <button className="btn-gold" onClick={() => setStep(1)} disabled={!canNext0}>
            {t('next')} →
          </button>
        )}

        {step === 1 && (
          <button
            className={`btn-gold ${result?.status === 'paid' ? 'btn-success' : ''}`}
            onClick={handleSubmit}
            disabled={!canNext1 || submitting}
          >
            {submitting ? '⚙️ Anba Revizyon…' : `✅ ${t('submit_claim')}`}
          </button>
        )}

        {step === 2 && (
          <button className="btn-gold" onClick={() => { setStep(0); setScanState('idle'); setResult(null); setApiError(null); }}>
            {t('new_claim')}
          </button>
        )}
      </div>
    </div>
  );
}
