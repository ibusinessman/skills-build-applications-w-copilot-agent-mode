import React, { useState } from 'react';
import { useLang } from '../App.jsx';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const { lang, setLang } = useLang();
  const [tab, setTab]         = useState('login');   // login | register
  const [username, setUser]   = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const copy = {
    ht: {
      title:    'Xtra Asirans Dubaj',
      sub:      'Konekte oswa Kreye Kont Ou',
      login:    'Konekte',
      register: 'Enskri',
      user:     'Non Itilizatè',
      email:    'Imèl',
      pass:     'Modpas (min 8)',
      phone:    'Nimewo MonCash',
      go_login: 'Konekte kounye a',
      go_reg:   'Kreye Kont',
      demo_tip: 'Demo: jean_moto / xtra2026!',
    },
    fr: {
      title:    'Xtra Assurance Dubai',
      sub:      'Connectez-vous ou Créez un Compte',
      login:    'Connexion',
      register: 'Inscription',
      user:     "Nom d'utilisateur",
      email:    'Email',
      pass:     'Mot de passe (min 8)',
      phone:    'Numéro MonCash',
      go_login: 'Se connecter',
      go_reg:   'Créer un compte',
      demo_tip: 'Demo: jean_moto / xtra2026!',
    },
  };
  const c = copy[lang];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (tab === 'login') {
        await api.login(username, password);
      } else {
        await api.register({ username, email, password, phone });
      }
      onLogin();
    } catch (err) {
      const msg = err.data
        ? Object.values(err.data).flat().join(' ')
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 64, filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.6))' }}>🛡️</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)', marginBottom: 4 }}>{c.title}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>{c.sub}</p>
        {/* Lang toggle */}
        <div className="lang-toggle" style={{ display: 'inline-flex', marginTop: 12 }}>
          {['ht', 'fr'].map(l => (
            <button key={l} className={`lang-btn ${lang === l ? 'active' : ''}`} onClick={() => setLang(l)}>
              {l === 'ht' ? '🇭🇹 KW' : '🇫🇷 FR'}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 4 }}>
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              style={{
                flex: 1, background: tab === t ? 'var(--gold)' : 'none', border: 'none',
                color: tab === t ? '#001233' : 'var(--text-dim)',
                borderRadius: 10, padding: '8px 0', fontWeight: 800, fontSize: 13, cursor: 'pointer',
              }}
            >
              {t === 'login' ? c.login : c.register}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="moncash-label">{c.user}</label>
            <input className="moncash-input" type="text" value={username} onChange={e => setUser(e.target.value)} required autoComplete="username" />
          </div>

          {tab === 'register' && (
            <div>
              <label className="moncash-label">{c.email}</label>
              <input className="moncash-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
          )}

          <div>
            <label className="moncash-label">{c.pass}</label>
            <input className="moncash-input" type="password" value={password} onChange={e => setPass(e.target.value)} required minLength={8} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
          </div>

          {tab === 'register' && (
            <div>
              <label className="moncash-label">{c.phone}</label>
              <input className="moncash-input" type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required placeholder="509XXXXXXXX" inputMode="numeric" />
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(255,69,69,0.12)', border: '1px solid rgba(255,69,69,0.4)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#ff8080' }}>
              ⚠️ {error}
            </div>
          )}

          <button className="btn-gold" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? '⚙️ …' : (tab === 'login' ? c.go_login : c.go_reg)}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', marginTop: 14 }}>
          {c.demo_tip}
        </p>
      </div>

      <p style={{ marginTop: 16, fontSize: 11, color: 'var(--text-dim)' }}>
        Dubai Quality, Ayiti Protection 🇦🇪🇭🇹
      </p>
    </div>
  );
}
