import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './screens/Home.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Claim from './screens/Claim.jsx';
import Wallet from './screens/Wallet.jsx';
import Notifications from './screens/Notifications.jsx';
import Referrals from './screens/Referrals.jsx';
import Profile from './screens/Profile.jsx';
import Login from './screens/Login.jsx';
import NavBar from './components/NavBar.jsx';
import Logo from './components/Logo.jsx';
import { ToastProvider } from './toast.jsx';
import { translations } from './i18n.js';
import { api } from './api.js';

export const LangContext = createContext(null);

export function useLang() {
  return useContext(LangContext);
}

function SplashScreen() {
  return (
    <div className="splash-screen">
      <Logo variant="hero" size={160} animated />
      <p className="splash-title">XTRA ASSURANCE</p>
      <p className="splash-tag">Dubai Quality, Ayiti Protection</p>
      <div className="splash-loader">
        <span /><span /><span />
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang]       = useState(() => localStorage.getItem('xtra_lang') || 'ht');
  const [authed, setAuthed]   = useState(() => api.isLoggedIn());
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    localStorage.setItem('xtra_lang', lang);
  }, [lang]);

  useEffect(() => {
    const tmr = setTimeout(() => setBooting(false), 900);
    return () => clearTimeout(tmr);
  }, []);

  function t(key) {
    return translations[lang][key] ?? key;
  }

  if (booting) {
    return (
      <LangContext.Provider value={{ lang, setLang, t }}>
        <SplashScreen />
      </LangContext.Provider>
    );
  }

  if (!authed) {
    return (
      <LangContext.Provider value={{ lang, setLang, t }}>
        <ToastProvider>
          <div className="app-container login-container">
            <Login onLogin={() => setAuthed(true)} />
          </div>
        </ToastProvider>
      </LangContext.Provider>
    );
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <ToastProvider>
        <BrowserRouter>
          <div className="app-container">
            <Routes>
              <Route path="/"                  element={<Home />} />
              <Route path="/xtra-panne"        element={<Dashboard />} />
              <Route path="/xtra-reklamasyon"  element={<Claim />} />
              <Route path="/wallet"            element={<Wallet />} />
              <Route path="/notifications"     element={<Notifications />} />
              <Route path="/referrals"         element={<Referrals />} />
              <Route path="/profile"           element={<Profile onLogout={() => setAuthed(false)} />} />
            </Routes>
            <NavBar />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </LangContext.Provider>
  );
}
