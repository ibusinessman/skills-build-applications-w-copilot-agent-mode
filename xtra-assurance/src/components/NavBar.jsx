import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '../App.jsx';

export default function NavBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, unreadCount } = useLang();

  const items = [
    { path: '/',                 icon: '🏠', labelKey: 'home' },
    { path: '/xtra-panne',       icon: '📊', labelKey: 'dashboard' },
    { path: '/xtra-reklamasyon', icon: '📋', labelKey: 'claim' },
    { path: '/wallet',           icon: '💼', labelKey: 'wallet' },
    { path: '/profile',          icon: '👤', labelKey: 'profile' },
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navigation principale">
      {items.map(({ path, icon, labelKey }) => (
        <button
          key={path}
          className={`nav-item ${pathname === path ? 'active' : ''}`}
          onClick={() => navigate(path)}
          aria-current={pathname === path ? 'page' : undefined}
        >
          <span className="nav-icon-wrap">
            <span className="nav-icon">{icon}</span>
            {labelKey === 'home' && unreadCount > 0 && (
              <span className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </span>
          <span className="nav-label">{t(labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
