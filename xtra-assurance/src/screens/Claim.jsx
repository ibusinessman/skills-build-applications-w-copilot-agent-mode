import React, { useState, useCallback } from 'react';
import { useLang } from '../App.jsx';

const AMOUNT = 3500;
const AUTO_APPROVE_THRESHOLD = 5000;

function StepIndicator({ current, labels }) {
  return (
    <div className="step-indicator" role="list" aria-label="Etap reklamasyon">
      {labels.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div className="step-item" role="listitem">
              <div className={`step-dot ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`step-label ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                {label}
              </span>
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
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [scanState, setScanState] = useState('idle'); // idle | scanning | done
  const [moncash, setMoncash] = useState('');

  const autoApprove = AMOUNT < AUTO_APPROVE_THRESHOLD;

  const stepLabels = [
    t('claim_step1').split(' ').slice(0, 2).join(' '),
    t('claim_step2').split(' ').slice(0, 2).join(' '),
    t('claim_step3').split(' ').slice(0, 2).join(' '),
  ];

  const handlePhotoTap = useCallback(() => {
    if (scanState !== 'idle') return;
    setScanState('scanning');
    setTimeout(() => setScanState('done'), 1800);
  }, [scanState]);

  const canAdvanceStep0 = scanState === 'done';
  const canAdvanceStep1 = moncash.length >= 8;

  function handleNext() {
    setStep(s => Math.min(s + 1, 2));
  }

  function handleBack() {
    setStep(s => Math.max(s - 1, 0));
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">{t('claim_screen_title')}</h1>
      </div>

      <StepIndicator current={step} labels={stepLabels} />

      {/* ── Step 0: Photo capture ─────────────────────────── */}
      {step === 0 && (
        <div className="step-card">
          <h2 className="step-title">{t('claim_step1')}</h2>
          <p className="step-tech">{t('claim_step1_tech')}</p>

          <div
            className="photo-zone"
            role="button"
            tabIndex={0}
            aria-label={t('scan_placeholder')}
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
                <div className="scan-bar">
                  <div className="scan-progress" />
                </div>
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

      {/* ── Step 1: Amount & MonCash ──────────────────────── */}
      {step === 1 && (
        <div className="step-card">
          <h2 className="step-title">{t('claim_step2')}</h2>
          <p className="step-tech">{t('claim_step1_tech')}</p>

          <div className="amount-zone">
            <div className="amount-big">{t('amount_detected')}</div>
            <div className={`approval-pill ${autoApprove ? 'auto' : 'review'}`}>
              {autoApprove ? t('approve_auto') : t('approve_review')}
            </div>
          </div>

          <div className="moncash-input-group">
            <label className="moncash-label" htmlFor="moncash-num">
              {t('moncash_label')}
            </label>
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
        </div>
      )}

      {/* ── Step 2: Payout confirmation ───────────────────── */}
      {step === 2 && (
        <div className="step-card">
          <h2 className="step-title">{t('claim_step3')}</h2>
          <p className="step-tech">{t('payout_time')}</p>

          <div className="payout-zone">
            <span className="payout-emoji" role="img" aria-label="money">💰</span>
            <p className="payout-confirmed">{t('payout_confirmed')}</p>
            <p className="payout-time">{t('payout_5min')}</p>

            <div className="payout-breakdown">
              <div className="payout-row">
                <span>{t('amount_detected')}</span>
                <span>3 500 g</span>
              </div>
              <div className="payout-row">
                <span>MonCash</span>
                <span>{moncash ? `+509 ${moncash.slice(0,4)}-${moncash.slice(4)}` : '—'}</span>
              </div>
              <div className="payout-row">
                <span>Status</span>
                <span className="success-text">⚡ En Cours</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="step-nav">
        {step > 0 && (
          <button className="btn-outline" onClick={handleBack}>
            ← {t('back')}
          </button>
        )}

        {step < 2 ? (
          <button
            className="btn-gold"
            onClick={handleNext}
            disabled={step === 0 ? !canAdvanceStep0 : !canAdvanceStep1}
          >
            {t('next')} →
          </button>
        ) : (
          <button className="btn-gold btn-success" onClick={() => {}}>
            ✅ {t('submit_claim')}
          </button>
        )}
      </div>
    </div>
  );
}
