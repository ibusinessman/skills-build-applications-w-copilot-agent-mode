import React, { useState, useEffect, useCallback } from 'react';
import { useLang } from '../App.jsx';
import { api } from '../api.js';
import { useToast } from '../toast.jsx';
import ScreenHeader from '../components/ScreenHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SkeletonCard, SkeletonRow } from '../components/Skeleton.jsx';
import PageSEO from '../components/PageSEO.jsx';

const STATUS_BADGE = {
  pending:    { color: 'var(--warning)', bg: 'rgba(255,149,0,0.14)' },
  registered: { color: 'var(--gold)',    bg: 'rgba(212,175,55,0.14)' },
  bonus_paid: { color: 'var(--success)', bg: 'rgba(0,208,132,0.14)' },
};

export default function Referrals() {
  const { t, lang } = useLang();
  const toast = useToast();
  const [referrals, setReferrals] = useState([]);
  const [me, setMe]               = useState(null);
  const [loading, setLoading]     = useState(true);
  const [phone, setPhone]         = useState('');
  const [sending, setSending]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [refs, profile] = await Promise.all([api.referrals(), api.me()]);
      setReferrals(refs);
      setMe(profile);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleSend(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    setSending(true);
    try {
      const ref = await api.sendReferral(phone);
      setReferrals(r => [ref, ...r]);
      setPhone('');
      toast.success(lang === 'ht' ? 'Envitasyon voye!' : 'Invitation envoyée!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  function copyCode() {
    if (!me?.referral_code) return;
    navigator.clipboard?.writeText(me.referral_code).then(
      () => toast.success(t('code_copied'))
    );
  }

  function shareWA() {
    if (!me) return;
    const msg = lang === 'ht'
      ? `🛡️ Vin sou Xtra Asirans Dubaj! Itilize kòd ${me.referral_code} pou ou jwenn 50g bonus. Telechaje: https://xtra-asirans.ht`
      : `🛡️ Rejoins Xtra Assurance Dubai! Utilise le code ${me.referral_code} pour 50g bonus. Télécharge: https://xtra-asirans.ht`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function shareSMS() {
    if (!me) return;
    const msg = lang === 'ht'
      ? `Vin sou Xtra Asirans Dubaj! Kòd: ${me.referral_code} - 50g bonus.`
      : `Rejoins Xtra Assurance Dubai! Code: ${me.referral_code} - 50g bonus.`;
    window.open(`sms:?body=${encodeURIComponent(msg)}`, '_self');
  }

  if (loading) {
    return (
      <div className="screen fade-in">
        <ScreenHeader title={t('referrals_title')} />
        <SkeletonCard />
        <div style={{ height: 12 }} />
        <SkeletonRow />
      </div>
    );
  }

  const earned     = referrals.filter(r => r.status === 'bonus_paid').reduce((s, r) => s + r.bonus_gourdes, 0);
  const pendingCnt = referrals.filter(r => r.status !== 'bonus_paid').length;

  const refDesc = lang === 'ht'
    ? 'Envite zanmi ou sou Xtra Assurance epi touche 50 goud bonus pou chak chauffè ou refere ann Ayiti. Pataje kòd parenaj ou ak WhatsApp oswa SMS.'
    : 'Invitez vos amis sur Xtra Assurance et gagnez 50 gourdes de bonus pour chaque chauffeur que vous parrainez en Haïti. Partagez votre code via WhatsApp ou SMS.';

  return (
    <div className="screen fade-in">
      <PageSEO
        path="/referrals"
        title={lang === 'ht' ? 'Parenaj — Touche 50g Bonus' : 'Parrainage — Gagnez 50g Bonus'}
        description={refDesc}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Xtra Assurance Referral Program',
          description: refDesc,
          url: 'https://xtra-asirans.ht/referrals',
          mainEntity: {
            '@type': 'Service',
            name: 'Xtra Assurance Referral Bonus',
            description: 'Touche 50 goud pou chak zanmi ou refere ki enskri sou Xtra Assurance.',
            offers: { '@type': 'Offer', price: '50', priceCurrency: 'HTG', name: 'Referral Bonus' },
          },
        }}
      />
      <ScreenHeader title={t('referrals_title')} />

      {/* Hero */}
      <div className="card gold-card referral-hero">
        <div className="referral-icon">🎁</div>
        <h2 className="referral-hero-title">{t('referral_hero')}</h2>
        <p className="referral-hero-sub">{t('referral_sub')}</p>

        {me?.referral_code && (
          <div className="referral-code-box">
            <div className="code-label">{t('your_code')}</div>
            <div className="code-value">{me.referral_code}</div>
            <button className="btn-gold" onClick={copyCode}>
              📋 {t('copy_code')}
            </button>
          </div>
        )}

        <div className="share-row">
          <button className="share-btn share-wa" onClick={shareWA}>
            <span>💬</span><span>WhatsApp</span>
          </button>
          <button className="share-btn share-sms" onClick={shareSMS}>
            <span>📱</span><span>SMS</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div className="card" style={{ textAlign: 'center', padding: '14px 6px' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold)' }}>{referrals.length}</div>
          <div className="card-label" style={{ marginBottom: 0, fontSize: 10 }}>{t('invites_sent')}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 6px' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--warning)' }}>{pendingCnt}</div>
          <div className="card-label" style={{ marginBottom: 0, fontSize: 10 }}>{t('pending')}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 6px' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--success)' }}>{earned}g</div>
          <div className="card-label" style={{ marginBottom: 0, fontSize: 10 }}>{t('earned_total')}</div>
        </div>
      </div>

      {/* Manual invite form */}
      <form className="card" onSubmit={handleSend}>
        <div className="card-label">{t('invite_friend')}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            className="moncash-input"
            type="tel"
            inputMode="numeric"
            placeholder={t('friend_phone')}
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            maxLength={11}
            style={{ flex: 1 }}
          />
          <button className="btn-gold" type="submit" disabled={sending || phone.length < 8} style={{ width: 'auto', padding: '12px 20px' }}>
            {sending ? '…' : '→'}
          </button>
        </div>
      </form>

      {/* Referrals list */}
      <div className="section" style={{ marginTop: 16 }}>
        <h2 className="section-title gold-text">{t('invites_sent')}</h2>
        {referrals.length === 0 ? (
          <EmptyState icon="🤝" title={t('no_referrals')} subtitle={t('no_referrals_sub')} />
        ) : (
          <div className="referral-list">
            {referrals.map(r => {
              const badge = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
              return (
                <div key={r.id} className="referral-row">
                  <div className="referral-avatar">📱</div>
                  <div className="referral-body">
                    <div className="referral-phone">+{r.referee_phone}</div>
                    <div className="referral-meta">{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 12,
                    background: badge.bg, color: badge.color, whiteSpace: 'nowrap',
                  }}>
                    {r.status_display}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
