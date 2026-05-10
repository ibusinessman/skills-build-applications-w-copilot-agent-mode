import React, { useState } from 'react';
import { useLang } from '../App.jsx';
import { api } from '../api.js';
import { useToast } from '../toast.jsx';
import Logo from '../components/Logo.jsx';

export default function Login({ onLogin }) {
  const { lang, setLang } = useLang();
  const toast = useToast();
  const [tab, setTab]         = useState('login');
  const [username, setUser]   = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [phone, setPhone]     = useState('');
  const [refCode, setRefCode] = useState('');
  const [loading, setLoading] = useState(false);

  const copy = {
    ht: {
      sub:      'Konekte ak Kont Xtra Ou',
      login:    'Konekte',
      register: 'Enskri',
      user:     'Non Itilizatè',
      email:    'Imèl',
      pass:     'Modpas (min 8)',
      phone:    'Nimewo MonCash',
      refcode:  'Kòd Parenaj (opsyonèl)',
      go_login: 'Konekte kounye a',
      go_reg:   'Kreye Kont Xtra',
      demo_tip: '⚡ Demo: jean_moto / xtra2026!',
      separator: 'oswa',
      quick_demo: '🚀 Demo Rapid',
    },
    fr: {
      sub:      'Connectez-vous à Votre Compte Xtra',
      login:    'Connexion',
      register: 'Inscription',
      user:     "Nom d'utilisateur",
      email:    'Email',
      pass:     'Mot de passe (min 8)',
      phone:    'Numéro MonCash',
      refcode:  'Code Parrainage (optionnel)',
      go_login: 'Se connecter',
      go_reg:   'Créer Compte Xtra',
      demo_tip: '⚡ Demo: jean_moto / xtra2026!',
      separator: 'ou',
      quick_demo: '🚀 Demo Rapide',
    },
  };
  const c = copy[lang];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await api.login(username, password);
      } else {
        await api.register({ username, email, password, phone, referral_code: refCode });
      }
      onLogin();
    } catch (err) {
      const msg = err.data
        ? Object.values(err.data).flat().join(' ')
        : err.message;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function quickDemo() {
    setLoading(true);
    try {
      await api.login('jean_moto', 'xtra2026!');
      onLogin();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      {/* Decorative background */}
      <div className="login-bg-glow" />
      <div className="login-bg-stars">
        <span>⭐</span><span>⭐</span><span>⭐</span>
      </div>

      {/* Brand */}
      <div className="login-brand">
        <Logo variant="hero" size={108} animated />
        <h1 className="login-title">XTRA ASSURANCE</h1>
        <p className="login-tagline">Dubai Quality, Ayiti Protection</p>
        <p className="login-sub">{c.sub}</p>
      </div>

      {/* Lang toggle floating top right */}
      <div className="login-lang">
        <div className="lang-toggle">
          {['ht', 'fr'].map(l => (
            <button
              key={l}
              className={`lang-btn ${lang === l ? 'active' : ''}`}
              onClick={() => setLang(l)}
            >
              {l === 'ht' ? '🇭🇹 KW' : '🇫🇷 FR'}
            </button>
          ))}
        </div>
      </div>

      {/* Auth card */}
      <div className="card login-card">
        <div className="login-tabs">
          {['login', 'register'].map(tb => (
            <button
              key={tb}
              type="button"
              className={`login-tab ${tab === tb ? 'active' : ''}`}
              onClick={() => setTab(tb)}
            >
              {tb === 'login' ? c.login : c.register}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label className="moncash-label">{c.user}</label>
            <input className="moncash-input" type="text" value={username}
                   onChange={e => setUser(e.target.value)} required autoComplete="username" />
          </div>

          {tab === 'register' && (
            <div>
              <label className="moncash-label">{c.email}</label>
              <input className="moncash-input" type="email" value={email}
                     onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
          )}

          <div>
            <label className="moncash-label">{c.pass}</label>
            <input className="moncash-input" type="password" value={password}
                   onChange={e => setPass(e.target.value)} required minLength={8}
                   autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
          </div>

          {tab === 'register' && (
            <>
              <div>
                <label className="moncash-label">{c.phone}</label>
                <input className="moncash-input" type="tel" value={phone}
                       onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                       required placeholder="509XXXXXXXX" inputMode="numeric" />
              </div>
              <div>
                <label className="moncash-label">{c.refcode}</label>
                <input className="moncash-input" type="text" value={refCode}
                       onChange={e => setRefCode(e.target.value.toUpperCase())} maxLength={12} />
              </div>
            </>
          )}

          <button className="btn-gold btn-shimmer" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? '⚙️ …' : (tab === 'login' ? c.go_login : c.go_reg)}
          </button>
        </form>

        <div className="login-separator">
          <span>{c.separator}</span>
        </div>

        <button className="btn-outline" onClick={quickDemo} disabled={loading}>
          {c.quick_demo}
        </button>

        <p className="login-demo-tip">{c.demo_tip}</p>
      </div>

      <p className="login-footer">🇦🇪 Dubai Tech · 🇭🇹 Ayiti Service</p>
    </div>
  );
}
