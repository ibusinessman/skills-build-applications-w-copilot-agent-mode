'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useBetSlipStore } from '@/store/betSlip.store';

export function Header() {
  const { user, logout, loadFromStorage } = useAuthStore();
  const { selections, toggleOpen } = useBetSlipStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <header className="bg-bet-card border-b border-bet-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🇭🇹</span>
          <span className="font-bold text-xl">
            <span className="text-haiti-blue">Haiti</span>
            <span className="text-haiti-red">Bet</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="text-slate-300 hover:text-white transition-colors">
            Matchs
          </Link>
          {user && (
            <>
              <Link href="/bets" className="text-slate-300 hover:text-white transition-colors">
                Mes Paris
              </Link>
              <Link href="/wallet" className="text-slate-300 hover:text-white transition-colors">
                Wallet
              </Link>
              {user.isAdmin && (
                <Link href="/admin" className="text-haiti-gold hover:text-yellow-300 transition-colors">
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Balance */}
              <Link
                href="/wallet"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bet-dark border border-bet-border text-sm font-medium"
              >
                <span className="text-haiti-gold font-bold">
                  {parseFloat(user.balance?.toString() ?? '0').toLocaleString()} HTG
                </span>
              </Link>

              {/* Bet slip */}
              <button
                onClick={toggleOpen}
                className="relative flex items-center gap-1.5 btn-primary text-sm py-1.5"
              >
                🎲 Coupon
                {selections.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-haiti-red text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {selections.length}
                  </span>
                )}
              </button>

              <button
                onClick={logout}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="text-sm text-slate-300 hover:text-white">
                Connexion
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm py-1.5">
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
