import React, { useState, useEffect, useCallback } from 'react';
import { useLang } from '../App.jsx';
import { api } from '../api.js';
import { useToast } from '../toast.jsx';
import ScreenHeader from '../components/ScreenHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SkeletonRow } from '../components/Skeleton.jsx';

const NOTIF_ICONS = {
  risk_alert: '🚨',
  policy:     '🛡️',
  claim:      '📋',
  payment:    '⚡',
  referral:   '🎁',
  promo:      '✨',
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)     return 'kounye a';
  if (diff < 3600)   return `${Math.floor(diff / 60)} min`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
}

export default function Notifications() {
  const { t } = useLang();
  const toast = useToast();
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all'); // all | unread

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setNotifs(await api.notifications());
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleMarkAllRead() {
    try {
      await api.markAllRead();
      setNotifs(n => n.map(x => ({ ...x, read: true })));
      toast.success(t('success_saved'));
    } catch (e) {
      toast.error(e.message);
    }
  }

  const filtered = tab === 'unread' ? notifs.filter(n => !n.read) : notifs;
  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="screen fade-in">
      <ScreenHeader
        title={t('notifications_title')}
        action={unreadCount > 0 ? (
          <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 12, width: 'auto' }} onClick={handleMarkAllRead}>
            ✓
          </button>
        ) : null}
      />

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button className={`filter-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          {t('all')} <span className="tab-count">{notifs.length}</span>
        </button>
        <button className={`filter-tab ${tab === 'unread' ? 'active' : ''}`} onClick={() => setTab('unread')}>
          {t('unread')} <span className="tab-count">{unreadCount}</span>
        </button>
      </div>

      {loading ? (
        <>
          <SkeletonRow /><div style={{ height: 8 }} />
          <SkeletonRow /><div style={{ height: 8 }} />
          <SkeletonRow />
        </>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔔" title={t('no_notifications')} subtitle={t('no_notifications_sub')} />
      ) : (
        <div className="notif-list">
          {filtered.map(n => (
            <div key={n.id} className={`notif-row ${n.read ? '' : 'unread'}`}>
              <div className={`notif-icon notif-${n.notif_type}`}>
                {NOTIF_ICONS[n.notif_type] || '🔔'}
              </div>
              <div className="notif-body">
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">{timeAgo(n.created_at)}</div>
              </div>
              {!n.read && <div className="unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
