import React from 'react';
import { useLang } from '../App.jsx';

export default function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <div className="lang-toggle">
      <button
        className={`lang-btn ${lang === 'ht' ? 'active' : ''}`}
        onClick={() => setLang('ht')}
        aria-label="Kreyòl Ayisyen"
      >
        🇭🇹 KW
      </button>
      <button
        className={`lang-btn ${lang === 'fr' ? 'active' : ''}`}
        onClick={() => setLang('fr')}
        aria-label="Français"
      >
        🇫🇷 FR
      </button>
    </div>
  );
}
