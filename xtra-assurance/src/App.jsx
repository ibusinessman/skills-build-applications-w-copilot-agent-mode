import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './screens/Home.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Claim from './screens/Claim.jsx';
import NavBar from './components/NavBar.jsx';
import { translations } from './i18n.js';

export const LangContext = createContext(null);

export function useLang() {
  return useContext(LangContext);
}

export default function App() {
  const [lang, setLang] = useState('ht');

  function t(key) {
    return translations[lang][key] ?? key;
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/xtra-panne" element={<Dashboard />} />
            <Route path="/xtra-reklamasyon" element={<Claim />} />
          </Routes>
          <NavBar />
        </div>
      </BrowserRouter>
    </LangContext.Provider>
  );
}
