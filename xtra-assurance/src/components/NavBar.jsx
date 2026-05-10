import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '../App.jsx';

export default function NavBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLang();

  const items = [
    { path: '/',                  icon: '🏠', labelKey: 'home' },
    { path: '/xtra-panne',        icon: '📊', labelKey: 'dashboard' },
    { path: '/xtra-reklamasyon',  icon: '📋', labelKey: 'claim' },
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
          <span className="nav-icon">{icon}</span>
          <span className="nav-label">{t(labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
